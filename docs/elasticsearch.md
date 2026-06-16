# Elasticsearch — Search, Filter & Phân trang

Tài liệu này giải thích cách dự án dùng **Elasticsearch (ES)** làm "bản sao để đọc" phục vụ tìm kiếm / lọc / phân trang, và cách dữ liệu được **đồng bộ tự động** từ MySQL qua NATS.

---

## 1. Kiến trúc (CQRS-lite)

```
         ghi (create/update/delete)
WRITE ──────────────► MySQL (nguồn sự thật)
                         │  @EmitEvent  publish "user.changed"
                         ▼
                       NATS ──┬─► invalidate cache Redis      (cacheInvalidation.event.ts)
                              └─► index/xoá trong Elasticsearch (searchIndex.event.ts)

READ  ── /users/search ──► Elasticsearch   (full-text, bỏ dấu, lọc, sort, phân trang)
      ── /users/findOne ─► Redis → MySQL    (chi tiết theo id)
```

- **MySQL** = nguồn sự thật (ghi).
- **Elasticsearch** = read-model: chỉ chứa field cần tìm, đánh chỉ mục để search nhanh.
- **NATS** = keo dán: ghi DB xong phát 1 event, subscriber tự đẩy vào ES (xem [nats.md](./nats.md)).
- Lệch dữ liệu? TTL cache + backfill ES là lưới an toàn.

> Vì sao không search thẳng MySQL? `LIKE '%...%'` không dùng được index, không bỏ dấu, không xếp hạng độ liên quan, chậm khi dữ liệu lớn. ES sinh ra để làm đúng việc này.

---

## 2. Cấu hình & file liên quan

| Việc | Ở đâu |
|---|---|
| Địa chỉ ES | `ELASTICSEARCH_NODE` trong [app.constant.ts](../src/constants/app.constant.ts) — mặc định `http://localhost:9200` |
| Client + `ensureIndex` | [elasticsearch.config.ts](../src/config/elasticsearch.config.ts) |
| **Engine search dùng chung** (logic index/search/paginate/bulk) | [base.search.helper.ts](../src/helper/base.search.helper.ts) (`SearchEngine<T>`) |
| Khai báo index `users` (mapping + field + toDoc) | [user.search.ts](../src/apis/common/user/user.search.ts) |
| Subscriber đồng bộ ES | [searchIndex.event.ts](../src/events/searchIndex.event.ts) |
| Phát event ở write path | `@EmitEvent` trong [user.service.ts](../src/apis/common/user/user.service.ts) |
| API search | `GET /users/search` ([user.controller.ts](../src/apis/common/user/user.controller.ts)) |
| Bật lúc khởi động | [main.ts](../src/main.ts): connect + `ensureIndex` + đăng ký subscriber + `reindexUsersIfEmpty` |

Chạy ES bằng Docker (đã có trong [docker-compose.yml](../docker-compose.yml)):
```bash
docker compose up -d                # Redis + NATS + Elasticsearch
# máy yếu, chỉ cần cache/event:
docker compose up -d redis nats
```
> ES ngốn RAM (~1-2GB). Kiểm tra: http://localhost:9200/_cluster/health

---

## 3. Tại sao cần analyzer? (`vi_folded` & `vi_autocomplete`)

**Analyzer** = công thức ES dùng để *cắt chữ thành token + chuẩn hoá* lúc lưu (index) và lúc tìm (search). Khớp hay không là khớp theo **token**, nên chọn analyzer = chọn "chế độ" tìm của field đó. Trong dự án có 2 nhu cầu khác nhau → 2 analyzer khác nhau.

### 3.1. `vi_folded` — để gõ KHÔNG DẤU / không phân biệt hoa-thường vẫn ra

`vi_folded` = `lowercase` + `asciifolding`.

- **Vấn đề:** ES so khớp theo từng ký tự. `"Nhân"` và `"nhan"` là 2 chuỗi khác nhau → không xử lý gì thì gõ `nhan` **không** ra `Nhân`.
- **`asciifolding`** bỏ dấu: `Nhân → nhan`, `Tuấn → tuan`, `đ → d`.
- **`lowercase`** bỏ phân biệt hoa-thường: `NHAN → nhan`.
- Áp dụng ở **cả lúc index lẫn lúc search** nên 2 phía đều quy về dạng không dấu/chữ thường → khớp nhau.

| Gõ | Khớp |
|---|---|
| `nhan` | Huỳnh **Nhân** |
| `huynh` | **Huỳnh** Nhân |
| `NHAN` | Nhân |

Không cần cài plugin. `multi_match` còn bật `fuzziness: AUTO` nên gõ sai 1-2 ký tự vẫn ra.

### 3.2. `vi_autocomplete` — để GÕ TỚI ĐÂU GỢI Ý TỚI ĐÓ (dropdown kiểu Facebook)

> Analyzer này dành cho tính năng **gợi ý/typeahead**. Search thật (`/users/search`) **không** dùng nó.

`vi_autocomplete` = `lowercase` + `asciifolding` + **`edge_ngram`**.

- **Vấn đề:** full-text khớp **nguyên token**. `vi_folded` lưu `huynhthanhnhan632004@gmail.com` thành nguyên token `huynhthanhnhan632004` → gõ `huynh` (chỉ là một phần) **không** ra. (Đúng cái bạn gặp.)
- **`edge_ngram`** cắt sẵn các **tiền tố** lúc index: `hu, huy, huyn, huynh, …` → gõ tiền tố nào cũng khớp ngay.

**Vì sao tách riêng, không gộp 1 analyzer cho tất cả?**
- `edge_ngram` làm index **phình to** (1 từ đẻ ra nhiều token con) và match rộng hơn → chỉ trả giá ở đúng field cần gợi ý.
- Search thật giữ `vi_folded` cho **nhẹ & chính xác**. → 2 analyzer cho 2 mục đích.
- Field gợi ý đặt `search_analyzer: vi_folded`: chỉ ngram lúc **index**, lúc **query KHÔNG ngram lại** (nếu ngram cả query thì `huynh` → `h, hu, huy…` sẽ match bừa, vừa sai vừa nặng).

### 3.3. So sánh nhanh

| Analyzer | = gì | Giải quyết | Dùng ở field |
|---|---|---|---|
| `vi_folded` | lowercase + asciifolding | gõ không dấu/hoa-thường vẫn ra; khớp **token đầy đủ** | search thật: `us_name`, `us_email`… |
| `vi_autocomplete` | + edge_ngram | gõ **tiền tố** là ra (typeahead) | chỉ field gợi ý: `us_name.auto` |

> **Lưu ý tên gọi:** `vi_folded` / `vi_autocomplete` là **tên do bạn tự đặt** (định nghĩa ở `settings.analysis`, tham chiếu lại đúng chuỗi đó ở `mappings`) — không phải từ khoá built-in nên IDE không tự gợi ý. Built-in chỉ có vài cái tên cố định: `standard`, `keyword`, `whitespace`, `simple`…
>
> Hiện code mới có `vi_folded`. `vi_autocomplete` là ghi chú **thiết kế** cho tính năng gợi ý (chưa bật).

---

## 4. API: `GET /users/search`

Param chung (`q`, `page`, `limit`, `sort`, `order`) đến từ `BaseSearchQuery`; riêng `location` là của User.

| Query param | Ý nghĩa | Mặc định |
|---|---|---|
| `q` | Từ khoá full-text (tên, uid, email, công ty, trường, địa điểm) | — |
| `location` | Lọc **chính xác** theo địa điểm (field riêng của User) | — |
| `page` | Trang (bắt đầu từ 1) | `1` |
| `limit` | Số bản ghi/trang (tối đa 100) | `20` |
| `sort` | Field để sắp xếp, vd `us_followers_count`, `createdAt`. Bỏ trống = theo độ liên quan | _score |
| `order` | `asc` \| `desc` | `desc` |

**Ví dụ:**
```
GET /users/search?q=nhan&page=1&limit=10
GET /users/search?location=Hà Nội&sort=us_followers_count&order=desc
GET /users/search?q=huynh&sort=createdAt&order=desc
```

**Kết quả** (`metadata`):
```json
{
  "items": [ { "id": "...", "us_name": "Huỳnh Nhân", "us_followers_count": 12, ... } ],
  "total": 37,
  "page": 1,
  "limit": 10,
  "totalPages": 4
}
```

---

## 5. Đồng bộ dữ liệu hoạt động thế nào

1. `userService.create()` ghi MySQL xong → `@EmitEvent` publish `user.changed` `{ id, action: "create" }`.
2. `searchIndex.event.ts` nhận event → đọc lại user mới nhất từ MySQL → `indexUser()` đẩy vào ES.
3. `action: "delete"` → `userSearch.removeOne()` xoá khỏi ES.
4. Khởi động app: `reindexUsersIfEmpty()` đẩy toàn bộ user hiện có vào ES **nếu index đang trống** (vd user seed, hoặc dữ liệu có sẵn trước khi gắn ES).

> Mặc định `refresh: true` cho dev (search thấy ngay). Lên prod nên bỏ để ghi nhanh hơn (ES tự refresh ~1s/lần).

---

## 6. Engine dùng chung — thêm entity mới chỉ là KHAI BÁO

Toàn bộ logic (search, paginate, filter, fuzziness, bulk, count, index/remove) nằm **một chỗ** ở [base.search.helper.ts](../src/helper/base.search.helper.ts) (`SearchEngine<T>`). Mỗi entity **không viết lại logic** — chỉ khai báo 1 config:

```ts
// post.search.ts — toàn bộ phần riêng của Post
export const postSearch = new SearchEngine<PostEntity>({
    index: "posts",
    indexBody: { settings: { /* analyzer */ }, mappings: { properties: { /* field */ } } },
    searchableFields: [{ name: "content", boost: 2 }, { name: "tags" }],
    getId: (p) => p.id,
    toDoc: (p) => ({ id: p.id, content: p.content, tags: p.tags, createdAt: p.createdAt }),
});
```

Có ngay `postSearch.indexOne / removeOne / reindex / count / search`.

**Input search:** `q / page / limit / sort / order` đã nằm trong `BaseSearchQuery` (khai báo 1 lần). Entity chỉ `extends` rồi thêm field LỌC riêng:

```ts
export interface SearchPostInput extends BaseSearchQuery {
    tag?: string; // field lọc riêng của Post
}

export const searchPosts = (input: SearchPostInput) =>
    postSearch.search({ ...input, filters: { "tags.keyword": input.tag } });
```

Còn lại:

1. `ensureIndex(postSearch.index, postSearch.indexBody)` trong `main.ts`.
2. Khai báo subject `POST_CHANGED` ([event.subject.ts](../src/events/event.subject.ts)).
3. Gắn `@EmitEvent(EVENT_SUBJECT.POST_CHANGED, ...)` lên method ghi của PostService.
4. Đăng ký subscriber đồng bộ (giống `registerSearchIndexEvents`, đổi `userSearch` → `postSearch`).

> Phần KHÔNG thể bỏ là `mappings` + `searchableFields` + `toDoc` + field lọc riêng — vì mỗi entity có field khác nhau, ES bắt buộc phải biết. Đây là **khai báo**, không phải **logic lặp lại**.

---

## 7. Lệnh ES hữu ích khi debug

```bash
# Số doc trong index users
curl http://localhost:9200/users/_count

# Xem mapping
curl http://localhost:9200/users/_mapping

# Thử search trực tiếp
curl "http://localhost:9200/users/_search?q=us_name:nhan&pretty"

# Xoá index để tạo lại mapping mới (mapping cũ không sửa được khi index đang sống)
curl -X DELETE http://localhost:9200/users
```

> Đổi mapping (vd thêm analyzer): `DELETE` index rồi khởi động lại app — `ensureIndex` tạo mới + `reindexAllUsers` nạp lại.
