import { Request, Response } from "express";
import { OK } from "src/core/response.core";
import { authService } from "./auth.service";
import { LoginDto } from "./auth.dto";

class AuthController {
    public async login(req: Request, res: Response) {
        const payload = req.body as LoginDto;

        const item = await authService.login(payload);

        new OK({
            message: "Đăng nhập thành công",
            metadata: item,
        }).send(res);
    }
}

export const authController = new AuthController();
