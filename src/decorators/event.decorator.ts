import { natsConfig } from "src/config/nats.config";

/**
 * Dựng payload event từ KẾT QUẢ trả về của method + tham số đầu vào.
 * Nhận được giá trị return nên lấy được cả id vừa sinh ra (vd user mới tạo).
 */
type PayloadBuilder = (result: any, args: any[]) => unknown;

/**
 * @EmitEvent — sau khi method chạy XONG (ghi DB thành công) thì PHÁT 1 event
 * lên NATS. Các subscriber (invalidate cache, index Elasticsearch, gửi noti...)
 * tự xử lý phần của mình mà không phải sửa nghiệp vụ ở đây.
 *
 * Lỗi khi publish KHÔNG làm hỏng nghiệp vụ (đã ghi DB rồi) — chỉ log.
 *
 * Đặt @EmitEvent TRÊN @StartTransaction để event chỉ phát sau khi commit.
 *
 * @example
 * @EmitEvent(EVENT_SUBJECT.USER_CHANGED, (user) => ({ id: user.id, action: "create" }))
 * @StartTransaction()
 * async create(dto) { ... }
 */
export function EmitEvent(subject: string, buildPayload: PayloadBuilder) {
    return function (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: unknown, ...args: unknown[]) {
            const result = await originalMethod.apply(this, args);
            try {
                natsConfig.publish(subject, buildPayload(result, args));
            } catch (error) {
                console.log(`❌ [EmitEvent] publish "${subject}" lỗi:`, error);
            }
            return result;
        };

        return descriptor;
    };
}
