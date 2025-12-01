import {
    IsEmail,
    IsString,
    IsArray,
    IsInt,
    ValidateNested,
    IsObject,
    IsNotEmpty,
    IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { INotificationSettings, ISocialLinks } from "src/interfaces/child";
import { PartialType } from "@nestjs/mapped-types";
import { UserEntity } from "./user.entity";
import { CONST_ERROR } from "src/constants/constErro.constant";

export class CreateUserDto {
    // ===== REQUIRED FIELDS =====
    @IsString()
    @IsNotEmpty({
        message: CONST_ERROR.FIELD_NOT_EMPTY("Họ"),
    })
    us_firstName: string;

    @IsString()
    @IsNotEmpty({
        message: CONST_ERROR.FIELD_NOT_EMPTY("Tên"),
    })
    us_lastName: string;

    @IsString()
    @IsNotEmpty({
        message: CONST_ERROR.FIELD_NOT_EMPTY("Giới tính"),
    })
    us_gender: string;

    @IsString()
    @IsNotEmpty({
        message: CONST_ERROR.FIELD_NOT_EMPTY(
            "Số điện thoại, Email không được để trống"
        ),
    })
    identifier: string;

    @IsString()
    @IsNotEmpty({
        message: CONST_ERROR.FIELD_NOT_EMPTY("Mật khẩu không được để trống"),
    })
    us_password: string;

    // ===== OPTIONAL FIELDS - THÊM @IsOptional() =====
    @IsString()
    @IsOptional()
    us_auth?: string;

    @IsEmail()
    @IsOptional()
    us_email?: string;

    @IsString()
    @IsOptional()
    us_avatarImage?: string;

    @IsString()
    @IsOptional()
    us_avatar_color?: string;

    @IsString()
    @IsOptional()
    us_uid?: string;

    @IsInt()
    @IsOptional()
    us_posts_count?: number;

    @IsString()
    @IsOptional()
    us_work?: string;

    @IsString()
    @IsOptional()
    us_school?: string;

    @IsString()
    @IsOptional()
    us_quote?: string;

    @IsString()
    @IsOptional()
    us_location?: string;

    @IsArray()
    @IsOptional()
    us_blocked?: string[];

    @IsArray()
    @IsOptional()
    us_blocked_by?: string[];

    @IsInt()
    @IsOptional()
    us_followers_count?: number;

    @IsInt()
    @IsOptional()
    us_following_count?: number;

    @IsObject()
    @ValidateNested()
    @Type(() => Object)
    @IsOptional()
    us_setting_notifications?: INotificationSettings;

    @IsObject()
    @ValidateNested()
    @Type(() => Object)
    @IsOptional()
    us_social?: ISocialLinks;

    @IsString()
    @IsOptional()
    us_bg_image_version?: string;

    @IsString()
    @IsOptional()
    us_bg_image_id?: string;

    @IsString()
    @IsOptional()
    us_profile_picture?: string;
}
