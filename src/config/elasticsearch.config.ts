import { Client } from "@elastic/elasticsearch";
import { appConf, valuesCont } from "src/constants";

const config = appConf();
const val = valuesCont();

/**
 * Cấu hình & quản lý kết nối Elasticsearch (read-model cho search/filter/phân trang).
 *
 * MySQL vẫn là nguồn sự thật; ES chỉ là "bản sao để đọc", được đồng bộ qua
 * NATS (event "user.changed" -> subscriber index vào đây).
 */
class ElasticsearchConfig {
    public readonly client: Client;

    constructor() {
        this.client = new Client({ node: config.ELASTICSEARCH_NODE });
    }

    async connect(): Promise<void> {
        try {
            await this.client.ping();
            console.log(
                `${val.SUCCESS} Kết nối Elasticsearch thành công ${config.ELASTICSEARCH_NODE}`,
            );
        } catch (error) {
            console.log(`${val.FAIL} Kết nối Elasticsearch thất bại:`, error);
        }
    }

    /**
     * Tạo index nếu CHƯA tồn tại (kèm settings + mappings). Gọi 1 lần lúc khởi động.
     * Đã tồn tại thì bỏ qua (ES không cho đổi mapping của index đang sống).
     */
    async ensureIndex(
        index: string,
        body: { settings?: object; mappings?: object },
    ): Promise<void> {
        try {
            const exists = await this.client.indices.exists({ index });
            if (exists) return;

            await this.client.indices.create({ index, ...body });
            console.log(`${val.SUCCESS} Đã tạo Elasticsearch index "${index}"`);
        } catch (error) {
            console.log(`${val.FAIL} Lỗi tạo index "${index}":`, error);
        }
    }
}

export const elasticsearchConfig: ElasticsearchConfig = new ElasticsearchConfig();
