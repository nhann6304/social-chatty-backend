/**
 * Logger màu cho dễ học/dễ debug — dùng mã màu ANSI, không cần cài thư viện.
 * Mỗi loại thao tác một màu để nhìn console là biết hệ thống đang làm gì:
 *
 *   🟢 xanh lá  = LẤY TỪ CACHE ra (cache hit)
 *   🟡 vàng     = KHÔNG có trong cache, phải đọc DB (cache miss)
 *   🔵 xanh dương nhạt = LƯU vào cache (cache set)
 *   ⚪ xám      = XOÁ cache (invalidate)
 *   🟣 tím      = Elasticsearch ghi/xoá/backfill index
 *   🔎 xanh dương = Elasticsearch SEARCH
 *   📨 xám      = nhận event từ NATS
 */

const C = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

const paint = (color: string, text: string): string => `${color}${text}${C.reset}`;

export const log = {
    /* ───── Cache (Redis) ───── */
    cacheHit: (key: string) =>
        console.log(paint(C.green, `🟢 [CACHE HIT]  Lấy từ cache ra        → ${key}`)),
    cacheMiss: (key: string) =>
        console.log(paint(C.yellow, `🟡 [CACHE MISS] Không có trong cache, đọc DB → ${key}`)),
    cacheSet: (key: string, ttl: number) =>
        console.log(paint(C.cyan, `🔵 [CACHE SET]  Lưu vào cache          → ${key} (TTL ${ttl}s)`)),
    cacheDel: (key: string) =>
        console.log(paint(C.gray, `⚪ [CACHE DEL]  Xoá cache (invalidate) → ${key}`)),

    /* ───── Elasticsearch ───── */
    esIndex: (index: string, id: string) =>
        console.log(paint(C.magenta, `🟣 [ES INDEX]   Thêm/cập nhật index "${index}" → ${id}`)),
    esDelete: (index: string, id: string) =>
        console.log(paint(C.magenta, `🟣 [ES DELETE]  Xoá khỏi index "${index}"       → ${id}`)),
    esBulk: (index: string, n: number) =>
        console.log(paint(C.magenta, `🟣 [ES BULK]    Backfill ${n} bản ghi vào "${index}"`)),
    esSearch: (index: string, q: string, total: number) =>
        console.log(
            paint(C.blue, `🔎 [ES SEARCH]  Tìm bằng Elasticsearch trên "${index}" q="${q || ""}" → ${total} kết quả`),
        ),

    /* ───── NATS event ───── */
    event: (subject: string, detail: string) =>
        console.log(paint(C.gray, `📨 [NATS]       Nhận event "${subject}" → ${detail}`)),
};
