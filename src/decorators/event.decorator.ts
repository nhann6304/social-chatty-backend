import { natsConfig } from "src/config/nats.config";
import { EventPayloads } from "src/events/event.subject";

/**
 * @EmitEvent — sau khi method chạy XONG (ghi DB thành công) thì PHÁT 1 event
 * lên NATS. Các subscriber (invalidate cache, index Elasticsearch, gửi noti...)
 * tự xử lý phần của mình mà không phải sửa nghiệp vụ ở đây.
 *
 * Lỗi khi publish KHÔNG làm hỏng nghiệp vụ (đã ghi DB rồi) — chỉ log.
 *
 * Đặt @EmitEvent TRÊN @StartTransaction để event chỉ phát sau khi commit.

 * @example
 * @EmitEvent(EVENT_SUBJECT.USER_CHANGED, (user: UserEntity) => ({ id: user.id, action: "create" }))
 * @StartTransaction()
 * async create(dto) { ... }
 */
export function EmitEvent<S extends keyof EventPayloads, TResult = unknown>(
    subject: S,
    buildPayload: (result: TResult, args: unknown[]) => EventPayloads[S],
) {
    return function (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: unknown, ...args: unknown[]) {
            const result = (await originalMethod.apply(this, args)) as TResult;
            try {
                natsConfig.publish(subject, buildPayload(result, args));
            } catch (error) {
                console.log(`❌ [EmitEvent] publish "${String(subject)}" lỗi:`, error);
            }
            return result;
        };

        return descriptor;
    };
}
