import { TCacheKey } from "src/type/cache/CacheKey.type";

/** Tham số cho @Cacheable (method ĐỌC). */
export interface ICacheableOptions {
    key: TCacheKey;
    /** Thời hạn sống (giây). Mặc định 1 giờ. */
    ttl?: number;
}
