import { Request, Response } from "express";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { authService } from "./auth.service";
import { CreateUserDto } from "./auth.dto";
import { SuccessResponse } from "src/core/response.core";

class AuthController {
    public async register(req: Request, res: Response) {
        const payload = req.body as CreateUserDto;

        const item = await authService.register(payload);

        return res.status(200).json({
            message: "Lụm",
            metadata: item,
        });
    }

    public async hello(req: Request, res: Response) {
        SuccessResponse.OK(res, {
            message: "Hello",
        });
    }
}

export const authController = new AuthController();
