import { ISearchableField } from "./ISearchableField.interface";

/** Khai báo cho 1 index — phần DUY NHẤT mỗi entity phải tự viết. */
export interface ISearchEngineConfig<T> {
    /** Tên index trên ES, vd "users". */
    index: string;
    /** settings + mappings của index. */
    indexBody: { settings?: object; mappings?: object };
    /** Các field cho tìm full-text (kèm boost). */
    searchableFields: ISearchableField[];
    /** Lấy id từ entity. */
    getId: (entity: T) => string;
    /** Chuyển entity -> document để index (loại bỏ field nhạy cảm). */
    toDoc: (entity: T) => Record<string, unknown>;
}
