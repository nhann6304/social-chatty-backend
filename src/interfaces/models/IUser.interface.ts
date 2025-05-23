import { ObjectId } from "mongodb";
import { IBaseModel } from "../common/IBaseMode.interface";

export interface IUser extends IBaseModel<IUser> {
    user_uId: string;
    user_email: string;
    user_username: string;
    user_avatarColor: string;
}
