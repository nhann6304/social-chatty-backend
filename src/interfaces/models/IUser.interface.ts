// src/interfaces/IUser.interface.ts
import { ObjectId } from "mongodb";
import { IBaseModel } from "../common/IBaseMode.interface";
import { INotificationSettings } from "../child/INotificationSettings.interface";
import { ISocialLinks } from "../child/ISocialLinks.interface";

export interface IUser extends IBaseModel<IUser> {
    us_auth: IUser | string;
    us_name?: string;
    us_email?: string;
    us_password?: string;
    us_avatar_color?: string;
    us_uid?: string;

    us_posts_count: number;
    us_work: string;
    us_school: string;
    us_quote: string;
    us_location: string;

    // người dùng mà user này đã chặn.
    us_blocked: string[];
    // người dùng đã chặn user này.
    us_blocked_by: string[];

    // người dùng đang theo dõi user này
    us_followers_count: number;
    // người dùng mà user này đang theo dõi.
    us_following_count: number;

    us_setting_notifications: INotificationSettings | string;
    us_social: ISocialLinks | string;

    us_bg_image_version: string;
    us_bg_image_id: string;
    us_profile_picture: string;
}
