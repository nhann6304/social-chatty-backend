// src/entities/User.entity.ts

import { compare, hash } from "bcryptjs";
import { ABaseModel } from "src/abstracts/common/ABaseModel.abstract";
import { valuesCont } from "src/constants";
import { IUser } from "src/interfaces/models";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
} from "typeorm";

const ConstVal = valuesCont();

@Entity("users")
export class UserEntity extends ABaseModel implements IUser {
    @Column({ type: "varchar" })
    us_auth: string;

    @Column({ type: "varchar", nullable: true })
    us_name?: string;

    @Column({ type: "varchar", nullable: true, unique: true })
    us_email?: string;

    @Column({ type: "varchar", nullable: true })
    us_password?: string;

    @Column({ type: "varchar", nullable: true })
    us_avatar_color?: string;

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
    us_blocked: string[];

    @Column({ type: "json", nullable: true })
    us_blocked_by: string[];

    @Column({ type: "int", default: 0 })
    us_followers_count: number;

    @Column({ type: "int", default: 0 })
    us_following_count: number;

    @Column({ type: "json", nullable: true })
    us_setting_notifications: string;

    @Column({ type: "json", nullable: true })
    us_social: string;

    @Column({ type: "varchar", nullable: true })
    us_bg_image_version: string;

    @Column({ type: "varchar", nullable: true })
    us_bg_image_id: string;

    @Column({ type: "varchar", nullable: true })
    us_profile_picture: string;

    @BeforeInsert()
    async hashPasswordBeforeInsert(): Promise<void> {
        this.us_password = await hash(
            this.us_password,
            ConstVal.SALT_ROUND_PASSWORD
        );
    }

    async comparePassword(password: string): Promise<boolean> {
        return compare(password, this.us_password);
    }

    async hashPassword(password: string): Promise<string> {
        return hash(password, ConstVal.SALT_ROUND_PASSWORD);
    }
}
