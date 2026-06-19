/**
 * Tham số search CHUNG cho mọi index — khai báo 1 lần ở đây.
 * Mỗi entity chỉ cần `extends IBaseSearchQuery` rồi thêm field LỌC riêng của nó.
 */
export interface IBaseSearchQuery {
    q?: string; // từ khoá full-text
    page?: number | string; // trang, bắt đầu từ 1
    limit?: number | string; // số bản ghi/trang (tối đa 100)
    sort?: string; // field để sắp xếp, vd "createdAt". Bỏ trống -> theo độ liên quan (_score)
    order?: "asc" | "desc"; // chiều sắp xếp, mặc định "desc"
}
