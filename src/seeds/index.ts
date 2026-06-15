import { OnModuleInit } from "src/interfaces/common";
import { UserSeeder } from "./user.seeder";

/**
 * Đăng ký tất cả seeder ở đây.
 * Thêm dữ liệu cho bảng mới:
 *   1. Tạo class XxxSeeder implements OnModuleInit (trong src/seeds)
 *   2. Thêm `new XxxSeeder()` vào mảng dưới đây
 */
const seeders: OnModuleInit[] = [
    new UserSeeder(),
    // new postMessage
];

/**
 * Chạy lần lượt onModuleInit() của tất cả seeder đã đăng ký.
 * Được gọi sau khi kết nối DB thành công.
 */
export const runSeeders = async (): Promise<void> => {
    for (const seeder of seeders) {
        await seeder.onModuleInit();
    }
};
