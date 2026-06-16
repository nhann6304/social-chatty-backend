import { elasticsearchConfig } from "src/config/elasticsearch.config";
import { log } from "src/utils";

/** Field full-text để multi_match (kèm boost độ ưu tiên). */
export interface SearchableField {
    name: string;
    boost?: number;
}

/** Khai báo cho 1 index — phần DUY NHẤT mỗi entity phải tự viết. */
export interface SearchEngineConfig<T> {
    /** Tên index trên ES, vd "users". */
    index: string;
    /** settings + mappings của index. */
    indexBody: { settings?: object; mappings?: object };
    /** Các field cho tìm full-text (kèm boost). */
    searchableFields: SearchableField[];
    /** Lấy id từ entity. */
    getId: (entity: T) => string;
    /** Chuyển entity -> document để index (loại bỏ field nhạy cảm). */
    toDoc: (entity: T) => Record<string, unknown>;
}

/**
 * Tham số search CHUNG cho mọi index — khai báo 1 lần ở đây.
 * Mỗi entity chỉ cần `extends BaseSearchQuery` rồi thêm field LỌC riêng của nó.
 */
export interface BaseSearchQuery {
    q?: string; // từ khoá full-text
    page?: number | string; // trang, bắt đầu từ 1
    limit?: number | string; // số bản ghi/trang (tối đa 100)
    sort?: string; // field để sắp xếp, vd "createdAt". Bỏ trống -> theo độ liên quan (_score)
    order?: "asc" | "desc"; // chiều sắp xếp, mặc định "desc"
}

/** Tham số đầy đủ truyền cho engine: query chung + bộ lọc (term). */
export interface SearchParams extends BaseSearchQuery {
    filters?: Record<string, string | number | undefined>; // field -> value (lọc chính xác)
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Engine search dùng CHUNG cho mọi entity. Viết logic 1 lần:
 * index / remove / bulk reindex / count / search (full-text + filter + offset paginate).
 *
 * Mỗi entity chỉ cần tạo 1 instance kèm config (xem user.search.ts):
 *   export const userSearch = new SearchEngine<UserEntity>({ ...config... });
 */
export class SearchEngine<T> {
    constructor(private readonly cfg: SearchEngineConfig<T>) {}

    get index(): string {
        return this.cfg.index;
    }
    get indexBody(): { settings?: object; mappings?: object } {
        return this.cfg.indexBody;
    }

    private client() {
        return elasticsearchConfig.client;
    }

    /** Thêm/cập nhật 1 bản ghi (upsert theo id). */
    async indexOne(entity: T): Promise<void> {
        const id = this.cfg.getId(entity);
        await this.client().index({
            index: this.cfg.index,
            id,
            document: this.cfg.toDoc(entity),
            refresh: true, // dev: thấy ngay. Prod nên bỏ để ghi nhanh hơn.
        });
        log.esIndex(this.cfg.index, id); // 🟣 add vào index
    }

    /** Xoá 1 bản ghi khỏi index (không có thì bỏ qua). */
    async removeOne(id: string): Promise<void> {
        await this.client().delete(
            { index: this.cfg.index, id, refresh: true },
            { ignore: [404] },
        );
        log.esDelete(this.cfg.index, id); // 🟣 xoá khỏi index
    }

    /** Đẩy nhiều bản ghi (backfill). Trả về số lượng đã index. */
    async reindex(all: T[]): Promise<number> {
        if (!all.length) return 0;
        const operations = all.flatMap((e) => [
            { index: { _index: this.cfg.index, _id: this.cfg.getId(e) } },
            this.cfg.toDoc(e),
        ]);
        await this.client().bulk({ refresh: true, operations });
        log.esBulk(this.cfg.index, all.length); // 🟣 backfill
        return all.length;
    }

    /** Số doc hiện có trong index. */
    async count(): Promise<number> {
        const { count } = await this.client().count({ index: this.cfg.index });
        return count;
    }

    /** Tìm kiếm + lọc + phân trang (offset). */
    async search(params: SearchParams): Promise<PaginatedResult<unknown>> {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const from = (page - 1) * limit;

        const must: object[] = [];
        const filter: object[] = [];

        if (params.q && String(params.q).trim()) {
            must.push({
                multi_match: {
                    query: String(params.q).trim(),
                    fields: this.cfg.searchableFields.map((f) =>
                        f.boost ? `${f.name}^${f.boost}` : f.name,
                    ),
                    fuzziness: "AUTO", // chịu gõ sai 1-2 ký tự
                },
            });
        }
        for (const [field, value] of Object.entries(params.filters ?? {})) {
            if (value !== undefined && value !== "") {
                filter.push({ term: { [field]: value } });
            }
        }

        const query =
            must.length || filter.length
                ? { bool: { must, filter } }
                : { match_all: {} };

        // Có sort field -> sắp theo field; không -> để ES xếp theo độ liên quan (_score).
        const sort = params.sort
            ? [{ [params.sort]: params.order ?? "desc" }]
            : [];

        const res = await this.client().search({
            index: this.cfg.index,
            from,
            size: limit,
            query,
            sort: sort as any,
            track_total_hits: true,
        });

        const total =
            typeof res.hits.total === "number"
                ? res.hits.total
                : (res.hits.total?.value ?? 0);
        const items = res.hits.hits.map((h) => h._source);

        log.esSearch(this.cfg.index, String(params.q ?? ""), total); // 🔎 search bằng ES

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}
