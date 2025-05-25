export interface IBaseModel<T = any> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: T | string;
  updatedBy: T | string;
  version: number;
}
