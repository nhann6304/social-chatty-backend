import { Request, Response } from "express";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { OK } from "src/core/response.core";
import { authService } from "./auth.service";
import { CreateUserDto } from "./auth.dto";

class AuthController {
    public async create(req: Request, res: Response) {
        const payload = req.body as CreateUserDto;

        const item = await authService.create(payload);

        new OK({
            message: "Lụm",
            metadata: item,
        }).send(res);
    }
}

export const authController = new AuthController();
