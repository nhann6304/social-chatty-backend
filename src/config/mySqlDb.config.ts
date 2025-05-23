import { AppConf, ValuesCont } from "src/constants";
import mysql from "mysql2";

const config = AppConf();
const confVal = ValuesCont();

export const connectMySqlDb = () => {
    const connect = () => {
        const connection = mysql.createConnection({
            host: config.DATABASE_HOST,
            port: +config.DATABASE_PORT,
            user: config.DATABASE_USER,
            password: config.DATABASE_PASSWORD,
            database: config.DATABASE_NAME,
            timezone: "+07:00",
        });

        connection.connect((err) => {
            if (err) {
                console.error(`${confVal.FAIL} Kết nối MySQL thất bại:`, err);
            } else {
                console.log(`${confVal.SUCCESS} Kết nối MySQL thành công!`);
            }
        });

        return connection;
    };

    return connect();
};
