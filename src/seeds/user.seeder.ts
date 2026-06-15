import { AppDataSource } from "src/config/mySqlDb.config";
import { UserEntity } from "src/apis/common/user/user.entity";
import { appConf, valuesCont } from "src/constants";
import { OnModuleInit } from "src/interfaces/common";

const config = appConf();
const confVal = valuesCont();

/**
 * Seeder cho bảng users: tạo sẵn 1 user mặc định nếu chưa có.
 */
export class UserSeeder implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        const userRepository = AppDataSource.getRepository(UserEntity);

        const existed = await userRepository.findOne({
            where: { us_email: config.DEFAULT_USER_EMAIL },
        });

        if (existed) {
            console.log(`${confVal.SUCCESS} User mặc định đã có sẵn:`);
            return;
        }

        const user = userRepository.create({
            us_auth: "local",
            us_name: config.DEFAULT_USER_NAME,
            us_email: config.DEFAULT_USER_EMAIL,
            us_password: config.DEFAULT_USER_PASSWORD, // tự hash bởi @BeforeInsert
            us_avatarImage: "",
            us_avatar_color: "#9c27b0",
        });

        await userRepository.save(user);
        console.log(`${confVal.SUCCESS} Đã tạo user mặc định:`);
    }
}
