import { AppDataSource } from "src/config";
import { UserEntity } from "src/entity/user.entity";
import { UtilConvert } from "src/utils/convert.util";

export class AuthService {
    private userRepository = AppDataSource.getRepository(UserEntity);

    public async getUserByUsernameOrEmail(payload: any) {
        const username = UtilConvert.convertFirstLetterUppercase(payload.us_name);
        const us_email = UtilConvert.lowerCase(payload.us_email);

        const findUser = await this.userRepository.findOne({
            where: [{ us_name: username }, { us_email: us_email }],
        });

        return findUser;
    }
}

export const authService: AuthService = new AuthService();
