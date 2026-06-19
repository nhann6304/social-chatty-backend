import { TCacheKey } from "src/type/cache/CacheKey.type";

/** Tham số cho @CacheEvict (method GHI). */
export interface ICacheEvictOptions {
    /** Xoá 1 key (hoặc hàm dựng key từ tham số). */
    key?: TCacheKey;
    /** Xoá theo mẫu, vd "users:list:*". */
    pattern?: TCacheKey;
}
