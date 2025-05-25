import { Request, Response } from "express";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { authService } from "src/services/auth.service";

export class AuthController {
    public async create(req: Request, res: Response): Promise<void> {
        const payload = req.body;

        const checkIsUserExist = await authService.getUserByUsernameOrEmail(
            payload
        );

        if (checkIsUserExist) {
            throw new BadRequestException("Lỗi");
        }


    }
}
