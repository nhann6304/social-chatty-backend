import { appConf, valuesCont } from "src/constants";
import { BaseCache } from "src/helper/base.cache.helper";

const config = valuesCont();

class RedisConfig extends BaseCache {
    constructor() {
        super("redisConnection");
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            const res = await this.client.ping();
            console.log(`${config.SUCCESS} Kết nối redis thành công ${res}`);
        } catch (error) {
            console.log(error);
        }
    }
}

export const redisConfig: RedisConfig = new RedisConfig();
