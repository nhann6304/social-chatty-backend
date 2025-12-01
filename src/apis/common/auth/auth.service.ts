import { AppDataSource } from "src/config";
import { UserEntity } from "src/apis/common/auth/user.entity";
import { UtilConvert } from "src/utils/convert.util";
import { CreateUserDto } from "./auth.dto";
import { Request, Response } from "express";
import { IUser } from "src/interfaces/models";
import { BadRequestException } from "src/abstracts/common/ACustomError.abstract";
import { UtilCalculate, UtilsChecked } from "src/utils";
import { ObjectId } from "mongoose";
import { uploads } from "src/helper/uploadCloud.helper";
import { v4 as uuidv4 } from "uuid";
import { EGender } from "src/enum";
import { CheckedIsEmail } from "src/utils/checked.util";
class AuthService {
    private userRepository = AppDataSource.getRepository(UserEntity);

    public async getUserByEmail({ us_email }: Pick<IUser, "us_email">) {
        const email = UtilConvert.lowerCase(us_email);

        const findUser = await this.userRepository.findOne({
            where: [{ us_email: us_email }],
        });

        return findUser;
    }

    public async register(payload: CreateUserDto) {
        const uId = `${UtilCalculate.generateRandomIntegers(10)}`;
        const userId = uuidv4();

        //check  identifier là email hay số điện thoại

        if (UtilsChecked.CheckedIsEmail(payload.identifier)) {
            console.log("Vao");
        }

        if (UtilsChecked.CheckedIsPhone(payload.identifier)) {
            console.log("Vao ");
        }

        // const checkIfUserExist = await this.getUserByEmail({
        //     us_email,
        // });

        // if (checkIfUserExist) {
        //     throw new BadRequestException("Người dùng đã tồn tại");
        // }

        // Upload hình ảnh
        // const result = await uploads({
        //     file: payload.us_avatarImage,
        //     public_id: `social/${userId}`,
        //     invalidate: true,
        //     overwrite: true,
        // });

        const { identifier, us_avatarImage, ...userData } = payload;

        return {
            ...payload,
        };
    }
}

export const authService: AuthService = new AuthService();
