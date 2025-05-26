import { AppDataSource } from "src/config";
import { UserEntity } from "src/apis/common/auth/user.entity";
import { UtilConvert } from "src/utils/convert.util";
import { CreateUserDto } from "./auth.dto";
import { Request, Response } from "express";
import { IUser } from "src/interfaces/models";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { UtilCalculate } from "src/utils";
import { ObjectId } from "mongoose";
import { uploads } from "src/helper/uploadCloud.helper";
import { v4 as uuidv4 } from "uuid";
class AuthService {
    private userRepository = AppDataSource.getRepository(UserEntity);

    public async getUserByUsernameOrEmail({
        us_email,
        us_name,
    }: Pick<IUser, "us_name" | "us_email">) {
        const username = UtilConvert.convertFirstLetterUppercase(us_name);
        const email = UtilConvert.lowerCase(us_email);

        const findUser = await this.userRepository.findOne({
            where: [{ us_name: username }, { us_email: us_email }],
        });

        return findUser;
    }

    public async create(payload: CreateUserDto) {
        const { us_name, us_email } = payload;

        const uId = `${UtilCalculate.generateRandomIntegers(10)}`;
        const userId = uuidv4();

        const checkIfUserExist = await this.getUserByUsernameOrEmail({
            us_email,
            us_name,
        });

        if (checkIfUserExist) {
            throw new BadRequestException("Người dùng đã tồn tại");
        }


        const result = await uploads({
            file: payload.us_avatarImage,
            public_id: `social/${userId}`,
            invalidate: true,
            overwrite: true,
        });
        if (!result?.public_id) {
            throw new BadRequestException("Upload file thất bại");
        }

        const dataCreate = this.userRepository.create({
            ...payload,
            us_uid: uId,
            us_avatarImage: result.secure_url
        });

        return dataCreate;
    }
}

export const authService: AuthService = new AuthService();
