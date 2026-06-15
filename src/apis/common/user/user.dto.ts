// src/apis/common/user/user.dto.ts

import {
    IsEmail,
    IsOptional,
    IsString,
    IsArray,
    IsInt,
    ValidateNested,
    IsObject,
} from "class-validator";
import { INotificationSettings, ISocialLinks } from "src/interfaces/child";

export class CreateUserDto {
    @IsString()
    us_auth: string;

    @IsString()
    us_name: string;

    @IsOptional()
    @IsEmail()
    us_email?: string;

    @IsOptional()
    @IsString()
    us_password?: string;

    @IsString()
    us_avatarImage: string;

    @IsOptional()
    @IsString()
    us_avatar_color?: string;

    @IsOptional()
    @IsString()
    us_uid?: string;

    @IsOptional()
    @IsInt()
    us_posts_count?: number;

    @IsOptional()
    @IsString()
    us_work?: string;

    @IsOptional()
    @IsString()
    us_school?: string;

    @IsOptional()
    @IsString()
    us_quote?: string;

    @IsOptional()
    @IsString()
    us_location?: string;

    @IsOptional()
    @IsArray()
    us_blocked?: string[];

    @IsOptional()
    @IsArray()
    us_blocked_by?: string[];

    @IsOptional()
    @IsInt()
    us_followers_count?: number;

    @IsOptional()
    @IsInt()
    us_following_count?: number;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    us_setting_notifications?: INotificationSettings;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    us_social?: ISocialLinks;

    @IsOptional()
    @IsString()
    us_bg_image_version?: string;

    @IsOptional()
    @IsString()
    us_bg_image_id?: string;

    @IsOptional()
    @IsString()
    us_profile_picture?: string;
}
