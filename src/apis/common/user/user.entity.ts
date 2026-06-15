// src/apis/common/user/user.entity.ts

import { compare, hash } from "bcryptjs";
import { Entity, Column, BeforeInsert, Index } from "typeorm";
import { ABaseModel } from "src/abstracts/common/ABaseModel.abstract";
import { IUser } from "src/interfaces/models";
import { valuesCont } from "src/constants";
import { ISocialLinks } from "src/interfaces/child";

const ConstVal = valuesCont();

@Entity("users")
export class UserEntity extends ABaseModel implements IUser {
    @Column({ type: "varchar" })
    us_auth: string;

    @Index() // hay tra cứu theo tên đăng nhập
    @Column({ type: "varchar" })
    us_name: string;

    // unique đã tự tạo index cho cột này
    @Column({ type: "varchar", nullable: true, unique: true })
    us_email: string;

    @Column({ type: "varchar", nullable: true })
    us_password: string;

    @Column({ type: "varchar", nullable: true })
    us_avatar_color?: string;

    @Column({ type: "varchar" })
    us_avatarImage: string;

    @Index() // mã định danh công khai, hay dùng để tra cứu
    @Column({ type: "varchar", nullable: true })
    us_uid?: string;

    @Column({ type: "int", default: 0 })
    us_posts_count: number;

    @Column({ type: "varchar", nullable: true })
    us_work: string;

    @Column({ type: "varchar", nullable: true })
    us_school: string;

    @Column({ type: "varchar", nullable: true })
    us_quote: string;

    @Column({ type: "varchar", nullable: true })
    us_location: string;

    @Column({ type: "json", nullable: true })
    us_blocked: string[]; // chứa danh sách userId bị chặn

    @Column({ type: "json", nullable: true })
    us_blocked_by: string[]; // chứa danh sách userId đã chặn user này

    @Column({ type: "int", default: 0 })
    us_followers_count: number;

    @Column({ type: "int", default: 0 })
    us_following_count: number;

    @Column({
        type: "json",
        nullable: true,
    })
    us_setting_notifications: {
        messages: boolean;
        reactions: boolean;
        comments: boolean;
        follows: boolean;
    };

    @Column({
        type: "json",
        nullable: true,
    })
    us_social: ISocialLinks;

    @Column({ type: "varchar", nullable: true })
    us_bg_image_version: string;

    @Column({ type: "varchar", nullable: true })
    us_bg_image_id: string;

    @Column({ type: "varchar", nullable: true })
    us_profile_picture: string;

    @BeforeInsert()
    async hashPasswordBeforeInsert(): Promise<void> {
        if (this.us_password) {
            this.us_password = await hash(
                this.us_password,
                ConstVal.SALT_ROUND_PASSWORD,
            );
        }
    }

    async comparePassword(password: string): Promise<boolean> {
        return compare(password, this.us_password);
    }

    async hashPassword(password: string): Promise<string> {
        return hash(password, ConstVal.SALT_ROUND_PASSWORD);
    }
}
