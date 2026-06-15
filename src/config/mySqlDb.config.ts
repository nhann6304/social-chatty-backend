// src/database/connect.ts
import { appConf, valuesCont } from "src/constants";
import { MainModule } from "src/modules/main.module";
import { DataSource } from "typeorm";
import { runSeeders } from "src/seeds";

const config = appConf();
const confVal = valuesCont();

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
        console.log(`${confVal.SUCCESS} Kết nối MySQL thành công!`);

        // Chạy seeder (onModuleInit) cho toàn bộ dữ liệu mặc định
        await runSeeders();
    } catch (err) {
        console.error(`${confVal.FAIL} Kết nối MySQL thất bại:`, err);
    }
};
