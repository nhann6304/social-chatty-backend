import { IBaseSearchQuery } from "./IBaseSearchQuery.interface";

/** Tham số đầy đủ truyền cho engine: query chung + bộ lọc (term). */
export interface ISearchParams extends IBaseSearchQuery {
    filters?: Record<string, string | number | undefined>; // field -> value (lọc chính xác)
}
