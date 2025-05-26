import express, { Express } from "express";
import { SetUpServer } from "src/config/server.config";
import { CloudinaryConfig, connectMySqlDb } from "./config";

class Application {
    public initialize(): void {
        // connectMongooseDb();
        connectMySqlDb();
        this.loadConfig();
        const app: Express = express();
        const server: any = new SetUpServer(app);
        server.start();
    }

    public loadConfig(): void {
        CloudinaryConfig.configure();
    }
}
// Gọi đối tượng
const main = new Application();
main.initialize();
