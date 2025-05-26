// src/dtos/user/create-user.dto.ts

import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
    MaxLength,
    IsArray,
    IsJSON,
    IsInt,
} from "class-validator";
import { UserEntity } from "src/entity/user.entity";

export class CreateUserDto extends UserEntity {
    // @IsString()
    // us_auth: string;

    @IsOptional()
    @IsString()
    us_name?: string;

    @IsOptional()
    @IsEmail()
    us_email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(32)
    us_password?: string;

    // @IsOptional()
    // @IsString()
    // us_avatar_color?: string;

    // @IsOptional()
    // @IsString()
    // us_uid?: string;

    // @IsOptional()
    // us_posts_count: number;

    // @IsString()
    // us_work: string;

    // @IsString()
    // us_school: string;

    // @IsString()
    // us_quote: string;

    // @IsString()
    // us_location: string;

    // @IsArray()
    // us_blocked: string[];

    // @IsArray()
    // us_blocked_by: string[];

    // @IsInt()
    // us_followers_count: number;

    // @IsInt()
    // us_following_count: number;

    // @IsString()
    // us_setting_notifications: string;

    // @IsString()
    // us_social: string;

    // @IsString()
    // us_bg_image_version: string;

    // @IsString()
    // us_bg_image_id: string;

    // @IsString()
    // us_profile_picture: string;
}
