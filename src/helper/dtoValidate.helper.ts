// src/helpers/validateDto.helper.ts

import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";

export const validateDto = <T extends object>(Dto: new () => T) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const instance = plainToInstance(Dto, req.body, {
                enableImplicitConversion: true,
            });

            await validateOrReject(instance, {
                whitelist: true, // loại bỏ fields không khai báo
                forbidNonWhitelisted: true, // nếu có field lạ => lỗi
            });

            req.body = instance; // gán lại vào req.body để dùng sau
            next();
        } catch (error) {
            // Gửi lỗi về middleware xử lý chung
            return next(new BadRequestException("Dữ liệu không hợp lệ"));
        }
    };
};
