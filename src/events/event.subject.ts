/**
 * Khai báo tập trung các "subject" (kênh) của NATS + kiểu payload tương ứng.
 * Để chỗ nào publish/subscribe cũng dùng chung 1 tên, tránh gõ sai chuỗi.
 *
 * Quy ước tên: "<đốitượng>.<hànhđộng>", vd "user.changed".
 */
export const EVENT_SUBJECT = {
    USER_CHANGED: "user.changed",
} as const;

/** Hành động gây thay đổi dữ liệu (để consumer biết nên làm gì). */
export type ChangeAction = "create" | "update" | "delete";

/** Payload gửi kèm khi 1 user thay đổi. */
export interface UserChangedEvent {
    id: string;
    action: ChangeAction;
}
