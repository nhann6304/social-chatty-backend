/**
 * Mô phỏng lifecycle hook OnModuleInit của NestJS.
 * Class nào implement interface này sẽ được gọi onModuleInit()
 * một lần khi app khởi động (sau khi kết nối DB).
 */
export interface OnModuleInit {
    onModuleInit(): Promise<void> | void;
}
