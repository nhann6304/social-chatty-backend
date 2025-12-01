// src/helpers/validateDto.helper.ts

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
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

            const errors = await validate(instance, {
                whitelist: true,
                forbidNonWhitelisted: true,
            });

            if (errors.length > 0) {
                // Format lỗi chi tiết
                const errorMessages = errors.map((error) => ({
                    field: error.property,
                    constraints: error.constraints,
                    value: error.value,
                }));

                console.log(
                    "Validation Errors:",
                    JSON.stringify(errorMessages, null, 2)
                );

                return next(
                    new BadRequestException(
                        "Dữ liệu không hợp lệ: " + JSON.stringify(errorMessages)
                    )
                );
            }

            req.body = instance;
            next();
        } catch (error) {
            console.error("Validation Error:", error);
            return next(new BadRequestException("Dữ liệu không hợp lệ"));
        }
    };
};
