# Redis Cache — Hướng dẫn dùng (Cache-Aside)

Tài liệu này giải thích **cách Redis được cấu hình trong dự án** và **cách áp dụng cache** cho một service bất kỳ, theo mẫu **Cache-Aside**.

---

## 1. Ý tưởng trong 30 giây

**Cache-Aside** = "cache đứng bên cạnh DB". Code tự quyết định khi nào đọc/ghi cache:

- **ĐỌC**: hỏi cache trước. Có (HIT) → trả luôn. Không có (MISS) → đọc DB → ghi vào cache → trả về.
- **GHI** (create/update/delete): **ghi DB trước**, sau đó **XÓA cache** (không sửa cache).

> Vì sao xóa chứ không update cache?
> Nếu 2 request cùng update một lúc, việc "update cache" dễ ghi đè nhầm bằng dữ liệu cũ (race condition).
> Xóa cache thì lần đọc kế tiếp sẽ tự nạp lại bản mới nhất từ DB → an toàn hơn.

> **TTL để tự lành**: mỗi key đều có thời hạn sống. Lỡ có chỗ quên xóa cache thì sau khi TTL hết,
> cache tự biến mất và được nạp lại từ DB. Đây là "lưới an toàn" cho mọi sai lệch (inconsistency).

---

## 2. Cấu hình & kết nối

| Việc | Ở đâu |
|---|---|
| Địa chỉ Redis | `REDIS_HOST` trong [src/constants/app.constant.ts](../src/constants/app.constant.ts) — mặc định `redis://localhost:6379` |
| Tạo client + các hàm cache | [src/helper/base.cache.helper.ts](../src/helper/base.cache.helper.ts) (`BaseCache`) |
| Kết nối (connect + ping) | [src/config/redis.config.ts](../src/config/redis.config.ts) (`redisConfig`) |
| Bật lúc khởi động | [src/main.ts](../src/main.ts) → `await redisConfig.connect()` |

Đổi địa chỉ Redis: đặt biến môi trường `REDIS_HOST` (vd trong file `.env`):

```env
REDIS_HOST=redis://localhost:6379
```

> Chạy Redis (kèm NATS) bằng `docker compose up -d` — xem [docker-compose.yml](../docker-compose.yml).

**Lưu ý an toàn:** nếu Redis chưa kết nối, các hàm cache **không ném lỗi** — `get` trả `null` (coi như miss, đọc thẳng DB), còn `set/del` bỏ qua. Nghĩa là Redis sập thì app vẫn chạy, chỉ chậm hơn.

---

## 3. Bộ hàm có sẵn (`redisConfig`)

> Đây là API **tầng thấp**. Dùng hằng ngày bạn chỉ cần **decorator** ở [mục 5](#5-cách-áp-dụng--dùng-decorator-khuyến-nghị); phần này để hiểu bên trong decorator gọi gì, hoặc khi cần xử lý cache thủ công.

Import ở đâu cần dùng:

```ts
import { redisConfig } from "src/config/redis.config";
```

| Hàm | Việc nó làm |
|---|---|
| `get<T>(key)` | Đọc key, tự `JSON.parse`. Không có → `null`. |
| `set<T>(key, value, ttl?)` | Ghi key (tự `JSON.stringify`) kèm TTL giây (mặc định `3600`). |
| `del(key \| key[])` | Xóa 1 hoặc nhiều key (dùng để invalidate). |
| `delByPattern("users:*")` | Xóa cả nhóm key theo mẫu (quét bằng SCAN, không làm nghẽn Redis). |
| `getOrSet<T>(key, loader, ttl?)` | Gói trọn Cache-Aside đọc: HIT trả luôn; MISS chạy `loader()` (đọc DB) → ghi cache → trả về. |

---

## 4. Quy ước đặt tên key

Đặt key có cấu trúc `đốitượng:loại:định_danh` để dễ xóa theo nhóm:

```
users:id:<id>          → chi tiết 1 user
users:list:all         → danh sách tất cả user
users:list:page:2      → danh sách trang 2
```

Nhờ vậy có thể xóa hết cache danh sách bằng `delByPattern("users:list:*")`.

---

## 5. Cách áp dụng — dùng DECORATOR (khuyến nghị)

Đây là cách dự án đang dùng: gắn `@Cacheable` / `@CacheEvict` lên method, **thân hàm chỉ còn logic DB thuần**, không đụng gì tới Redis. Xem mẫu thật tại [user.service.ts](../src/apis/common/user/user.service.ts).

### 5.1. Gom key về 1 chỗ — Key factory

[user.cache-key.ts](../src/apis/common/user/user.cache-key.ts) — để `@Cacheable` (đọc) và `@CacheEvict` (xoá) luôn tham chiếu **cùng** key, không lệch nhau:

```ts
export const UserKey = {
    byId: (id: string) => `users:id:${id}`, // key động theo id
    listAll: "users:list:all",
    listPattern: "users:list:*",            // mẫu để xoá mọi cache danh sách
} as const;
```

### 5.2. ĐỌC — `@Cacheable`

```ts
import { Cacheable, CacheEvict, StartTransaction } from "src/decorators";
import { UserKey } from "./user.cache-key";

@Cacheable({ key: UserKey.listAll, ttl: 300 })   // cache 5 phút
public async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();           // chỉ logic DB thuần
}

@Cacheable({ key: UserKey.byId, ttl: 600 })      // key động theo id, cache 10 phút
public async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
}
```

HIT → trả luôn, không chạy hàm. MISS → chạy hàm (đọc DB) → tự ghi cache → trả về.

### 5.3. GHI — `@CacheEvict`

```ts
@CacheEvict({ pattern: UserKey.listPattern })    // tạo user -> danh sách cũ -> dọn hết
@StartTransaction()
public async create(payload: CreateUserDto): Promise<UserEntity> {
    // ... giữ nguyên nghiệp vụ, KHÔNG còn dòng cache nào trong thân hàm ...
}
```

Với **update/delete** (id nằm trong tham số) thì evict cả key chi tiết lẫn danh sách:

```ts
@CacheEvict({ key: UserKey.byId, pattern: UserKey.listPattern })
public async update(id: string, dto: UpdateUserDto) { ... }
```

> ⚠️ **Thứ tự decorator:** đặt `@CacheEvict` **TRÊN** `@StartTransaction`. Decorator áp từ dưới lên → transaction (ghi DB) chạy & commit trước, rồi cache mới bị xoá. Đúng tinh thần Cache-Aside.

### 5.4. Cách THỦ CÔNG — `getOrSet` (khi decorator không hợp)

Chỉ dùng khi logic cache đặc biệt (key phụ thuộc nhiều thứ, điều kiện cache phức tạp...):

```ts
import { redisConfig } from "src/config/redis.config";

const user = await redisConfig.getOrSet(
    UserKey.byId(id),
    () => this.userRepository.findOne({ where: { id } }),
    600,
);
```

---

## 6. Khi có nhiều service: invalidate qua NATS

Nếu cache được nhiều service cùng đọc, sau khi ghi DB hãy **phát 1 event** thay vì tự gọi `del` —
để các service khác cũng dọn cache phần của mình. Xem [nats.md](./nats.md).

```ts
import { natsConfig } from "src/config/nats.config";
import { EVENT_SUBJECT } from "src/events/event.subject";

const saved = await this.userRepository.save(dataCreate);
natsConfig.publish(EVENT_SUBJECT.USER_CHANGED, { id: saved.id, action: "create" });
// Subscriber ở src/events/cacheInvalidation.event.ts sẽ nhận và xóa cache.
```

TTL vẫn là lưới an toàn cuối cùng kể cả khi event lỡ thất lạc.

---

## 7. Checklist khi thêm cache cho 1 API mới

1. Thêm key vào **key factory** của feature (vd `user.cache-key.ts`), theo quy ước mục 4.
2. ĐỌC: gắn `@Cacheable({ key, ttl })` lên method.
3. GHI: gắn `@CacheEvict({ key, pattern })`; nếu có transaction thì đặt `@CacheEvict` **trên** `@StartTransaction`.
4. Chọn TTL hợp lý: dữ liệu ít đổi để dài, hay đổi để ngắn.
5. Không cache dữ liệu nhạy cảm (mật khẩu, token) trừ khi đã loại bỏ field đó.
6. Nhiều service dùng chung? Publish event NATS để invalidate chéo (mục 6).
