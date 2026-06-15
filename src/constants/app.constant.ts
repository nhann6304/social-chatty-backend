export default () => ({
    SERVER_PORT: process.env.SERVER_HOST || "8000",
    SECRET_KEY_ONE: process.env.SECRET_KEY_ONE || "KEY_1",
    SECRET_KEY_TWO: process.env.SECRET_KEY_TWO || "KEY_2",
    REDIS_HOST: process.env.REDIS_HOST || "redis://localhost:6379",
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME || "dbxo4txn8",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "571465968332837",
    CLOUDINARY_API_SECRET:
        process.env.CLOUDINARY_API_SECRET || "MJltrHWbiTeIxaymv9AQpwDd0Gk",
    DATABASE_URL:
        process.env.DATABASE_URL || "mongodb://localhost:27017/social_db",
    //    MYSQL
    DATABASE_HOST: process.env.DATABASE_HOST || "localhost",
    DATABASE_PORT: process.env.DATABASE_PORT || "3306",
    DATABASE_USER: process.env.DATABASE_USER || "root",
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || "root",
    DATABASE_NAME: process.env.DATABASE_NAME || "social-network_db",
    // User mặc định - tự tạo khi chạy dự án (seed)
    DEFAULT_USER_NAME: process.env.DEFAULT_USER_NAME || "Huỳnh Nhân",
    DEFAULT_USER_EMAIL: process.env.DEFAULT_USER_EMAIL || "huynhthanhnhan632004@gmail.com",
    DEFAULT_USER_PASSWORD: process.env.DEFAULT_USER_PASSWORD || "Admin@123",
});
