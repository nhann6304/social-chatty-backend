// src/apis/common/auth/auth.dto.ts

import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
    @IsOptional()
    @IsString()
    us_name?: string;

    @IsOptional()
    @IsEmail()
    us_email?: string;

    @IsString()
    @IsNotEmpty()
    us_password: string;
}
