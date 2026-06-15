import express, { Express } from "express";
import { SetUpServer } from "src/config/server.config";
import { CloudinaryConfig, connectMySqlDb } from "./config";
import { redisConfig } from "./config/redis.config";

class Application {
    public loadConfig(): void {
        CloudinaryConfig.configure();
    }

    public initialize(): void {
        // Mỗi lần nodemon reload: xóa log cũ + in giờ khởi động lại
        console.clear();
        console.log(`🔄 [${new Date().toLocaleTimeString("vi-VN")}] Server reloaded`);

        //Connect redis
        // redisConfig.connect();

        //Connect MongoDB
        // connectMongooseDb();

        connectMySqlDb();
        this.loadConfig();
        const app: Express = express();
        const server: any = new SetUpServer(app);
        server.start();
    }
}

// Gọi đối tượng
const main = new Application();
main.initialize();
