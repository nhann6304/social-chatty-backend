import { redisConfig } from "src/config/redis.config";

/**
 * Key của cache:
 * - Chuỗi cố định: "users:list:all"
 * - Hoặc HÀM nhận đúng tham số của method để dựng key động:
 *       (id: string) => `users:id:${id}`
 */
type CacheKey = string | ((...args: any[]) => string);

interface CacheableOptions {
    key: CacheKey;
    /** Thời hạn sống (giây). Mặc định 1 giờ. */
    ttl?: number;
}

interface CacheEvictOptions {
    /** Xoá 1 key (hoặc hàm dựng key từ tham số). */
    key?: CacheKey;
    /** Xoá theo mẫu, vd "users:list:*". */
    pattern?: CacheKey;
}

/** Dựng key thật từ string|hàm + tham số của method. */
const resolve = (k: CacheKey | undefined, args: unknown[]): string | undefined =>
    typeof k === "function" ? k(...args) : k;

/**
 * @Cacheable — Cache-Aside cho method ĐỌC, tự động hoá hoàn toàn:
 *   1) Có trong cache -> trả luôn (không chạy method).
 *   2) Không có -> chạy method (đọc DB) -> ghi cache kèm TTL -> trả về.
 *
 * Method chỉ cần viết logic đọc DB thuần, không đụng gì tới Redis.
 *
 * @example
 * @Cacheable({ key: (id: string) => `users:id:${id}`, ttl: 600 })
 * async findById(id: string) {
 *     return this.userRepository.findOne({ where: { id } });
 * }
 */
export function Cacheable(options: CacheableOptions) {
    const { key, ttl = 3600 } = options;

    return function (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: unknown, ...args: unknown[]) {
            const cacheKey = resolve(key, args)!;

            const cached = await redisConfig.get(cacheKey);
            if (cached !== null) return cached; // HIT

            const result = await originalMethod.apply(this, args); // MISS -> đọc DB
            if (result !== null && result !== undefined) {
                await redisConfig.set(cacheKey, result, ttl);
            }
            return result;
        };

        return descriptor;
    };
}

/**
 * @CacheEvict — Cache-Aside cho method GHI (create/update/delete):
 *   chạy nghiệp vụ (ghi DB) TRƯỚC, thành công rồi mới XOÁ cache.
 *
 * Lưu ý thứ tự khi dùng chung @StartTransaction: đặt @CacheEvict Ở TRÊN
 * để cache chỉ bị xoá SAU KHI transaction đã commit.
 *
 * @example
 * @CacheEvict({ pattern: "users:list:*" })       // danh sách đã cũ -> dọn hết
 * @StartTransaction()
 * async create(dto: CreateUserDto) { ... }
 *
 * @CacheEvict({ key: (id: string) => `users:id:${id}`, pattern: "users:list:*" })
 * async update(id: string, dto: UpdateUserDto) { ... }
 */
export function CacheEvict(options: CacheEvictOptions) {
    const { key, pattern } = options;

    return function (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: unknown, ...args: unknown[]) {
            const result = await originalMethod.apply(this, args); // ghi DB trước

            const k = resolve(key, args);
            if (k) await redisConfig.del(k);

            const p = resolve(pattern, args);
            if (p) await redisConfig.delByPattern(p);

            return result; // rồi mới invalidate cache
        };

        return descriptor;
    };
}
