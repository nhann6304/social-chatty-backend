import { elasticsearchConfig } from "src/config/elasticsearch.config";
import { log } from "src/utils";
import {
    ISearchEngineConfig,
    ISearchParams,
    IPaginatedResult,
} from "src/interfaces/search";

/**
 * Engine search dùng CHUNG cho mọi entity. Viết logic 1 lần:
 * index / remove / bulk reindex / count / search (full-text + filter + offset paginate).
 *
 * Mỗi entity chỉ cần tạo 1 instance kèm config (xem user.search.ts):
 *   export const userSearch = new SearchEngine<UserEntity>({ ...config... });
 */
export class SearchEngine<T> {
    constructor(private readonly cfg: ISearchEngineConfig<T>) {}

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
    async search(params: ISearchParams): Promise<IPaginatedResult<unknown>> {
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
