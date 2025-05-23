import { ObjectId } from "mongoose";

export interface IBaseModel<T = any> {
  _id: ObjectId;
  createdAt: Date;
  createdBy: T | string;
  updatedBy: T | string;
}
