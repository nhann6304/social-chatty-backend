import { natsConfig } from "src/config/nats.config";
import { getRepository } from "src/database/transaction";
import { UserEntity } from "src/apis/common/user/user.entity";
import { userSearch } from "src/apis/common/user/user.search";
import { log } from "src/utils";
import { EVENT_SUBJECT, UserChangedEvent } from "./event.subject";

/**
 * Đăng ký subscriber NATS để ĐỒNG BỘ dữ liệu sang Elasticsearch khi user đổi.
 *
 *   Service ghi DB -> publish "user.changed" -> (ở đây) index/xoá trong ES.
 *
 * Đọc lại bản mới nhất từ MySQL (nguồn sự thật) rồi mới index — không phụ thuộc
 * cache. Gọi 1 lần lúc khởi động (sau khi đã connect NATS + ES + MySQL).
 */
export const registerSearchIndexEvents = (): void => {
    natsConfig.subscribe<UserChangedEvent>(
        EVENT_SUBJECT.USER_CHANGED,
        async ({ id, action }) => {
            log.event(EVENT_SUBJECT.USER_CHANGED, `${action} user ${id} → đồng bộ ES`);

            if (action === "delete") {
                await userSearch.removeOne(id); // engine tự log 🟣 ES DELETE
                return;
            }

            // create / update: lấy bản mới nhất từ DB rồi upsert vào ES.
            const user = await getRepository(UserEntity).findOne({ where: { id } });
            if (user) await userSearch.indexOne(user); // engine tự log 🟣 ES INDEX
        },
    );
};
