import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { IBaseResponse } from "src/interfaces/core/IBaseResponse.interface";

// 1. Giữ nguyên Base Abstract Class
abstract class RESPONSE<T = any> {
    message: string;
    metadata: T | undefined;
    totalItem?: number;
    abstract statusCode: number;
    abstract reasonStatusCode: string;

    constructor({ message, metadata }: IBaseResponse<T>) {
        this.message = message;
        this.metadata = metadata;
        // Tự động tính totalItem nếu metadata là array
        if (Array.isArray(this.metadata)) {
            this.totalItem = this.metadata.length;
        }
    }

    // Hàm send response
    send(res: Response) {
        return res.status(this.statusCode).json(this);
    }
}

// 2. Định nghĩa các class con (Không cần export lẻ tẻ nữa, hoặc export để dùng nội bộ)
class OK<T = any> extends RESPONSE<T> {
    statusCode: number = StatusCodes.OK;
    reasonStatusCode: string = ReasonPhrases.OK;
    constructor(data: IBaseResponse<T>) { super(data); }
}

class CREATE<T = any> extends RESPONSE<T> {
    statusCode: number = StatusCodes.CREATED;
    reasonStatusCode: string = ReasonPhrases.CREATED;
    constructor(data: IBaseResponse<T>) { super(data); }
}

// 3. Class chính bạn sẽ dùng (Chỉ cần export class này)
export class SuccessResponse {
    // Factory method cho OK (200)
    static OK<T>(res: Response, payload: IBaseResponse<T>) {
        return new OK<T>(payload).send(res);
    }

    // Factory method cho CREATED (201)
    static CRATED<T>(payload: IBaseResponse<T>) {
        return new CREATE<T>(payload);
    }
}