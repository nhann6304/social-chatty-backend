// src/database/connect.ts
import { DataSource } from "typeorm";
import { appConf, valuesCont } from "src/constants";
import { MainModule } from "src/modules/main.module";
import { redisConfig } from "./redis.config";

const config = appConf();
const confVal = valuesCont();

// ✅ Tạo và export DataSource ra ngoài
export const AppDataSource = new DataSource({
    type: "mysql",
    host: config.DATABASE_HOST,
    port: +config.DATABASE_PORT,
    username: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    database: config.DATABASE_NAME,
    timezone: "+07:00",
    synchronize: true,
    logging: false,
    entities: MainModule,
    maxQueryExecutionTime: 3000,
    extra: {
        connectionLimit: 10,
    },
});

export const connectMySqlDb = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        //Connect redis
        // redisConfig.connect();
        console.log(`${confVal.SUCCESS} Kết nối MySQL thành công!`);
    } catch (err) {
        console.error(`${confVal.FAIL} Kết nối MySQL thất bại:`, err);
    }
};
