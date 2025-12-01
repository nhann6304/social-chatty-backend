import { createAdapter } from "@socket.io/redis-adapter";
import compression from "compression";
import cookieSession from "cookie-session";
import cors from "cors";
import {
    Application,
    json,
    NextFunction,
    Request,
    Response,
    urlencoded,
} from "express";
import helmet from "helmet";
import hpp from "hpp";
import http, { createServer } from "http";
import { StatusCodes } from "http-status-codes";
import { createClient } from "redis";
import { Server } from "socket.io";
import applicationRoutes from "../routes/routes";
import { registerGlobalErrorHandler } from "../middlewares/common/errors.middleware";
import { appConf } from "src/constants";

const config = appConf();

export class SetUpServer {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    public start(): void {
        this.securityMiddleware(this.app); // bảo mật
        this.standardMiddleware(this.app); // middleware phổ thông
        this.routeMiddleware(this.app); // các route chính
        this.globalErrorHandler(this.app); // xử lý lỗi cuối cùng
        this.startServer(this.app); // khởi chạy server
    }

    // Đăng ký các middleware bảo mật
    private securityMiddleware(app: Application): void {
        app.use(
            cookieSession({
                name: "session",
                keys: ["key1", "key2"],
                maxAge: 24 * 7 * 3600000,
                // NODE_ENV trong file env
                secure: false,
            })
        );

        app.use(hpp());
        app.use(helmet());
        app.use(
            cors({
                origin: "*",
                credentials: true, // Cho phép gửi cookie/token từ frontend
                optionsSuccessStatus: 200,
                methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            })
        );
    }

    // Thiết lập các middleware phổ thông
    private standardMiddleware(app: Application): void {
        app.use(compression());
        // Giới hạn tối đa kích thước JSON gửi lên
        app.use(json({ limit: "50mb" }));
        app.use(urlencoded({ extended: true, limit: "50mb" }));
    }

    //  Để gắn các route chính của app
    private routeMiddleware(app: Application): void {
        applicationRoutes(app);
    }

    // Xử lý lỗi toàn cục(middleware cuối cùng):
    private globalErrorHandler(app: Application): void {
        registerGlobalErrorHandler(app);
    }

    // Cáu hình server khởi chạy(Server, Server socketIO)
    private async startServer(app: Application): Promise<void> {
        const httpServer = createServer(app);
        // const socketIO: Server = await this.createSocketIO(httpServer); // tắt thằng này khỏi chạy docker
        this.startHttpServer(httpServer);
        // tắt thằng này khỏi chạy docker
        // this.socketIOConnection(socketIO);
    }

    // Khởi tạo Socket.IO nếu app có sử dụng realtime(chat, notification...).
    private async createSocketIO(httpServer: http.Server): Promise<Server> {
        const io: Server = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            },
        });

        const pubClient = createClient({ url: config.REDIS_HOST });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        return io;
    }

    // Khởi chạy toàn bộ
    private startHttpServer(httpServer: http.Server): void {
        // console.log(`Server has started with process ${process.pid}`);
        httpServer.listen(config.SERVER_PORT, () => {
            console.log(`✅ Server is running ${config.SERVER_PORT}`);
        });
    }

    private socketIOConnection(id: Server): void { }
}
