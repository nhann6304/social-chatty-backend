import express, { Express } from "express";
import { SetUpServer } from "src/config/server.config";
import { CloudinaryConfig, connectMySqlDb } from "./config";
import { redisConfig } from "./config/redis.config";
import { natsConfig } from "./config/nats.config";
import { elasticsearchConfig } from "./config/elasticsearch.config";
import { registerCacheInvalidationEvents } from "./events/cacheInvalidation.event";
import { registerSearchIndexEvents } from "./events/searchIndex.event";
import {
    userSearch,
    reindexUsersIfEmpty,
} from "./apis/common/user/user.search";

class Application {
    public loadLog(): void {
        console.clear();
        console.log(
            `🔄 [${new Date().toLocaleTimeString("vi-VN")}] Server reloaded`,
        );
    }

    public loadConfig(): void {
        CloudinaryConfig.configure();
    }

    public loadConnect(): void { }

    public async initialize(): Promise<void> {
        //
        this.loadLog();
        // Mỗi lần nodemon reload: xóa log cũ + in giờ khởi động lại

        // Connect Redis (cache)
        await redisConfig.connect();

        // Connect NATS (event bus)
        await natsConfig.connect();

        // Connect Elasticsearch + tạo index "users" nếu chưa có
        await elasticsearchConfig.connect();
        await elasticsearchConfig.ensureIndex(
            userSearch.index,
            userSearch.indexBody,
        );

        // Đăng ký subscriber: (1) invalidate cache Redis, (2) index Elasticsearch
        registerCacheInvalidationEvents();
        registerSearchIndexEvents();

        //Connect MongoDB
        // connectMongooseDb();

        // Await MySQL để backfill ES đọc được DB; sau đó đẩy user hiện có vào ES.
        await connectMySqlDb();
        await reindexUsersIfEmpty();

        //
        this.loadConfig();
        //
        this.loadConnect();
        //

        const app: Express = express();
        const server: any = new SetUpServer(app);
        server.start();
    }
}
