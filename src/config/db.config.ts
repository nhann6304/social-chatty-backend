import mongoose from "mongoose";
import { AppConf } from "../constants";

const config = AppConf();
export const connectDb = () => {
    const connect = () => {
        mongoose
            .connect(config.DATABASE_URL)
            .then(() => {
                console.log("✅ Connect db success");
            })
            .catch((err) => {
                console.log("Connect db error", err);
                // Dừng app nếu kết nối DB thất bại (Tắt app luôn)
                return process.exit(1);
            });
    };
    connect();
    // Tự động kết nối lại nếu bị mất kết nối MongoDB
    mongoose.connection.on("disconnected", connect);
};
