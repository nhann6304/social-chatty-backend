import { userService } from "src/apis/common/user/user.service";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { LoginDto } from "./auth.dto";

class AuthService {
    public async login(payload: LoginDto) {
        const { us_name, us_email, us_password } = payload;

        const user = await userService.getUserByUsernameOrEmail({
            us_name,
            us_email,
        });

        if (!user) {
            throw new BadRequestException("Tài khoản không tồn tại");
        }

        const isMatch = await user.comparePassword(us_password);
        if (!isMatch) {
            throw new BadRequestException("Mật khẩu không đúng");
        }

        // TODO: phát hành JWT token ở đây
        return user;
    }
}

export const authService: AuthService = new AuthService();
