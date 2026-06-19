/**
 * Key của cache:
 * - Chuỗi cố định: "users:list:all"
 * - Hoặc HÀM nhận đúng tham số của method để dựng key động:
 *       (id: string) => `users:id:${id}`
 */
export type TCacheKey = string | ((...args: any[]) => string);
