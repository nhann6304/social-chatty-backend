import { createClient } from "redis";
import { appConf } from "src/constants";
import { log } from "src/utils";

type RedisClient = ReturnType<typeof createClient>;
const config = appConf();

/**
 * Lớp nền cho mọi cache dùng Redis.
 * - Giữ 1 client Redis + tự log lỗi kết nối.
 * - Cung cấp sẵn các hàm Cache-Aside: get / set / del / delByPattern / getOrSet.
 *
 * Lớp con (vd RedisConfig) chỉ cần lo việc connect().
 */
export abstract class BaseCache {
    client: RedisClient;
    protected readonly name: string;

    constructor(cacheName: string) {
        this.name = cacheName;
        this.client = createClient({ url: config.REDIS_HOST });
        this.cacheError();
    }

    private cacheError(): void {
        this.client.on("error", (error: unknown) => {
            console.log(`[${this.name}]`, error);
        });
    }

    /** Redis đã sẵn sàng nhận lệnh chưa (đã connect xong). */
    protected get isReady(): boolean {
        return this.client.isReady;
    }

    /* ───────────────────────── Cache-Aside helpers ───────────────────────── */

    /**
     * Đọc 1 key và tự parse JSON về kiểu T.
     * - Có dữ liệu  -> trả object (cache HIT).
     * - Không có    -> trả null (cache MISS) để caller đi đọc DB.
     */
    public async get<T>(key: string): Promise<T | null> {
        if (!this.isReady) return null; // Redis sập -> coi như miss, đọc thẳng DB
        const raw = await this.client.get(key);
        if (raw) {
            log.cacheHit(key); // 🟢 lấy từ cache ra
            return JSON.parse(raw) as T;
        }
        log.cacheMiss(key); // 🟡 không có -> caller đi đọc DB
        return null;
    }

    /**
     * Ghi 1 key kèm TTL (giây) — LUÔN có TTL để tự phục hồi nếu lỡ quên xoá.
     * Mặc định 1 giờ (3600s).
     */
    public async set<T>(
        key: string,
        value: T,
        ttlSeconds = 3600,
    ): Promise<void> {
        if (!this.isReady) return;
        await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
        log.cacheSet(key, ttlSeconds); // 🔵 lưu vào cache
    }

    /**
     * Xoá 1 hoặc nhiều key — dùng để INVALIDATE sau khi ghi DB.
     * (Cache-Aside: ghi DB trước, rồi XOÁ cache, không update cache.)
     */
    public async del(key: string | string[]): Promise<void> {
        if (!this.isReady) return;
        await this.client.del(key);
        ([] as string[]).concat(key).forEach((k) => log.cacheDel(k)); // ⚪ xoá cache
    }

    /**
     * Xoá theo MẪU, vd "users:*" để dọn cả nhóm key liên quan.
     * Dùng SCAN (không block Redis) thay cho KEYS.
     */
    public async delByPattern(pattern: string): Promise<void> {
        if (!this.isReady) return;
        const keys: string[] = [];
        for await (const key of this.client.scanIterator({
            MATCH: pattern,
            COUNT: 100,
        })) {
            keys.push(key);
        }
        if (keys.length) {
            await this.client.del(keys);
            log.cacheDel(`${pattern} (${keys.length} key)`); // ⚪ xoá cả nhóm
        }
    }

    /**
     * Cache-Aside cho thao tác ĐỌC, gói gọn 3 bước:
     *   1) Có trong cache -> trả luôn.
     *   2) Không có -> chạy loader() đọc DB.
     *   3) Ghi kết quả vào cache kèm TTL rồi trả về.
     *
     * @example
     * const user = await redisConfig.getOrSet(
     *   `users:id:${id}`,
     *   () => userService.findById(id),
     *   600, // TTL 10 phút
     * );
     */
    public async getOrSet<T>(
        key: string,
        loader: () => Promise<T>,
        ttlSeconds = 3600,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;

        const fresh = await loader();
        // Không cache giá trị rỗng để tránh "cache miss giả" kéo dài.
        if (fresh !== null && fresh !== undefined) {
            await this.set(key, fresh, ttlSeconds);
        }
        return fresh;
    }
}
