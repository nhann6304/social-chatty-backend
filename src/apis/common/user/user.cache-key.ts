/**
 * Tập trung mọi cache-key của User về một chỗ.
 * @Cacheable (đọc) và @CacheEvict (xoá) đều tham chiếu cùng builder ở đây
 * -> không bao giờ bị lệch key (ghi key này, xoá nhầm key kia).
 */
export const UserKey = {
    byId: (id: string) => `users:id:${id}`,

    listAll: "users:list:all",

    listPattern: "users:list:*",
};
