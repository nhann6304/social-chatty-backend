/** Mức cô lập của transaction (mặc định InnoDB là "REPEATABLE READ"). */
export type TIsolationLevel =
    | "READ UNCOMMITTED" // Đọc không được cam kết
    | "READ COMMITTED" // Đọc được cam kết
    | "REPEATABLE READ" // Đọc đơn lẻ  ==> Mặc định mysql
    | "SERIALIZABLE"; // Tuần tự hóa

// EAD UNCOMMITTED đọc không được cam két
// ==> Tốt:
// - Hiệu năng cao nhất (không khóa gì cả).
// ==> Xấu:
// - Nếu trong lúc đó 1 user đang update mà nếu như user đó update lỗi rollback thì trong quá trình đó data lỗi đó vẫn dược đọc

// ========================================

// READ COMMITTED đọc được cam két
// ==> Tốt:
// - Đúng dữ liệu khi query
// ==> Xấu:
// - Nếu trong lúc đó 1 user đang update thì phải chờ user đó commit xong mới lấy ra dược
// - Do phải chờ thì hiệu xuất rất kém

// ========================================

// REPEATABLE READ đọc đơn lẻ ==> Chỉ khi transition đó đã commit rồi thì đọc dữ liệu nó mới gọi là chính xác nhất
// ==> Tốt:
// - Đúng dữ liệu khi query
// - Giải quyết tình trang nhiều user update cùng 1 lúc
// ==> Xấu:
// - Chậm query và dễ sai dữ liệu khi phải chờ toàn bộ các  transition khác commit xong mới xác nhận dữ liệu cuối cùng

// ========================================

// SERIALIZABLE đọc tuần tự ==> Ai vào  trước cung cấp 1 key , khi đang update tiến hành khóa table các query update insert khác phải chờ khi nào key đầu nó commit mới dược đọc tiếp
// ==> Tốt:
// - Đúng dữ liệu khi query
// - Giải quyết tình trang nhiều user update cùng 1 lúc
// ==> Xấu:
// - Chậm query và dễ sai dữ liệu khi phải chờ toàn bộ các  transition khác commit xong mới xác nhận dữ liệu cuối cùng
// - Xảy ra hiện tương DeadLock
