export default () => ({
    SERVER_PORT: process.env.SERVER_HOST || "8000",
    DATABASE_URL:
        process.env.DATABASE_URL || "mongodb://localhost:27017/social_db",
    SECRET_KEY_ONE: process.env.SECRET_KEY_ONE || "KEY_1",
    SECRET_KEY_TWO: process.env.SECRET_KEY_TWO || "KEY_2",
    REDIS_HOST: process.env.REDIS_HOST || "redis://localhost:6379",
});
