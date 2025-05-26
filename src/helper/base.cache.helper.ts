import { createClient } from "redis";
import { appConf, valuesCont } from "src/constants";

type RedisClient = ReturnType<typeof createClient>;
const config = appConf();

export abstract class BaseCache {
    client: RedisClient;

    constructor(cacheName: string) {
        this.client = createClient({ url: config.REDIS_HOST });
        this.cacheError();
    }

    private cacheError(): void {
        this.client.on("error", (error: unknown) => {
            console.log(error);
        });
    }
}
