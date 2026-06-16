# NATS — Event Bus (invalidate cache & mở rộng)

NATS là một "đường truyền tin" nhẹ: service này **publish** (phát) một event, service khác **subscribe** (lắng nghe) và xử lý. Trong dự án, NATS dùng để **invalidate cache Redis giữa nhiều service**, và sau này để **đồng bộ dữ liệu sang Elasticsearch**.

---

## 1. Vì sao cần NATS?

Khi chỉ có **1 service**: ghi DB xong gọi thẳng `redisConfig.del(key)` là đủ.

Khi có **nhiều service** cùng đọc chung dữ liệu (vd: API service, search service dùng Elasticsearch, notification service...): service ghi DB không thể tự xóa cache của service khác. Giải pháp: phát 1 **event** "dữ liệu đã đổi", ai quan tâm thì tự xử lý phần của mình.

```
                                  ┌──> [API service]   xóa cache Redis
[Service ghi DB] --publish "user.changed"--> NATS ──┤
                                  └──> [Search service] re-index Elasticsearch
```

---

## 2. Cấu hình & kết nối

| Việc | Ở đâu |
|---|---|
| Địa chỉ NATS | `NATS_URL` trong [src/constants/app.constant.ts](../src/constants/app.constant.ts) — mặc định `nats://localhost:4222` |
| Quản lý kết nối + publish/subscribe | [src/config/nats.config.ts](../src/config/nats.config.ts) (`natsConfig`) |
| Khai báo tên event (subject) | [src/events/event.subject.ts](../src/events/event.subject.ts) |
| Subscriber dọn cache | [src/events/cacheInvalidation.event.ts](../src/events/cacheInvalidation.event.ts) |
| Bật lúc khởi động | [src/main.ts](../src/main.ts) → `await natsConfig.connect()` + `registerCacheInvalidationEvents()` |

Đổi địa chỉ: đặt biến môi trường (vd `.env`):

```env
NATS_URL=nats://localhost:4222
```

> Chạy NATS (kèm Redis) bằng `docker compose up -d` — xem [docker-compose.yml](../docker-compose.yml). Trang theo dõi: http://localhost:8222

**An toàn:** NATS chưa kết nối thì `publish` lặng lẽ bỏ qua (không ném lỗi); khi mất kết nối, client **tự reconnect vô hạn** (cấu hình sẵn trong `nats.config.ts`).

---

## 3. Cách dùng

### 3.1. Phát event (publish)

```ts
import { natsConfig } from "src/config/nats.config";
import { EVENT_SUBJECT } from "src/events/event.subject";

// Sau khi ghi DB thành công:
natsConfig.publish(EVENT_SUBJECT.USER_CHANGED, { id: saved.id, action: "create" });
```

`publish` là **fire-and-forget**: gửi xong đi tiếp, không chờ ai nhận.

### 3.2. Lắng nghe event (subscribe)

```ts
import { natsConfig } from "src/config/nats.config";
import { EVENT_SUBJECT, UserChangedEvent } from "src/events/event.subject";

natsConfig.subscribe<UserChangedEvent>(EVENT_SUBJECT.USER_CHANGED, async ({ id }) => {
    await redisConfig.del(`users:id:${id}`);
});
```

Mọi subscriber được đăng ký 1 lần lúc khởi động (xem `registerCacheInvalidationEvents`).

---

## 4. Thêm một event mới (mẫu 3 bước)

1. **Khai báo subject + payload** trong [event.subject.ts](../src/events/event.subject.ts):

```ts
export const EVENT_SUBJECT = {
    USER_CHANGED: "user.changed",
    POST_CHANGED: "post.changed", // ← mới
} as const;

export interface PostChangedEvent {
    id: string;
    action: ChangeAction;
}
```

2. **Publish** ở nơi ghi DB xong.
3. **Subscribe** để xử lý (xóa cache / re-index / gửi noti).

---

## 5. Elasticsearch — ĐÃ nối qua NATS

Event `user.changed` hiện có **2 subscriber** chạy song song, cùng 1 event:

| Subscriber | Việc |
|---|---|
| [cacheInvalidation.event.ts](../src/events/cacheInvalidation.event.ts) | Xoá cache Redis của user |
| [searchIndex.event.ts](../src/events/searchIndex.event.ts) | Index / xoá user trong Elasticsearch |

Write path phát event bằng decorator `@EmitEvent` (xem `create` trong [user.service.ts](../src/apis/common/user/user.service.ts)) — **không có dòng publish nào lẫn trong nghiệp vụ**. Chi tiết luồng search xem [elasticsearch.md](./elasticsearch.md).

Thêm consumer mới (gửi noti, analytics...) chỉ việc đăng ký thêm 1 subscriber, không đụng service.

---

## 6. Ghi nhớ

- 1 service → cứ gọi `redisConfig.del` trực tiếp cho đơn giản. NATS phát huy khi **nhiều service**.
- Event có thể thất lạc → **luôn để TTL cho cache** làm lưới an toàn (xem [redis.md](./redis.md)).
- Đặt tên subject theo `đốitượng.hànhđộng` (vd `user.changed`) cho nhất quán.
