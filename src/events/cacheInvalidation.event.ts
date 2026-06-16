import { natsConfig } from "src/config/nats.config";
import { redisConfig } from "src/config/redis.config";
import { log } from "src/utils";
import { EVENT_SUBJECT, UserChangedEvent } from "./event.subject";

/**
 * Đăng ký các subscriber NATS để INVALIDATE cache Redis khi dữ liệu đổi.
 *
 * Luồng Cache-Aside cross-service:
 *   Service A ghi DB  ->  publish "user.changed"
 *                      ->  (ở đây) nhận event  ->  xoá cache Redis tương ứng.
 *
 * Nhờ đi qua NATS, bất kỳ service nào (kể cả service khác máy) cũng nhận được
 * và dọn cache phần của mình. Sau này thêm Elasticsearch chỉ cần đăng ký thêm
 * 1 subscriber nữa ở đây để re-index, không phải sửa nghiệp vụ.
 *
 * Gọi 1 lần lúc khởi động (sau khi đã connect NATS + Redis).
 */
export const registerCacheInvalidationEvents = (): void => {
    natsConfig.subscribe<UserChangedEvent>(
        EVENT_SUBJECT.USER_CHANGED,
        async ({ id }) => {
            log.event(EVENT_SUBJECT.USER_CHANGED, `user ${id} → invalidate cache`);
            // Xoá cache chi tiết user + mọi cache danh sách user (tự log ⚪ CACHE DEL).
            await redisConfig.del(`users:id:${id}`);
            await redisConfig.delByPattern("users:list:*");
        },
    );
};
