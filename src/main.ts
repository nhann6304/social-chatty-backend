import express, { Express } from "express";
import { SetUpServer } from "src/config/server.config";
import { connectDb } from "./config/db.config";

class Application {
    public initialize(): void {
        connectDb();
        const app: Express = express();
        const server: any = new SetUpServer(app);
        server.start();
    }
}
// Gọi đối tượng
const main = new Application();
main.initialize();
