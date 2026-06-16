import { IError } from "src/interfaces/common/IErrors.interface";
import { StatusCodes } from "http-status-codes";

export abstract class CustomError extends Error {
    abstract statusCode: number;
    abstract status: string;

    constructor(message: string) {
        super(message);
    }

    serializeErrors(): IError {
        return {
            message: this.message,
            status: this.status,
            statusCode: this.statusCode,
        };
    }
}

export class BadRequestException extends CustomError {
    statusCode = StatusCodes.BAD_REQUEST; try
    status = "error";

    constructor(message: string) {
        super(message);
    }
}

export class BadGatewayException extends CustomError {
    statusCode = StatusCodes.BAD_GATEWAY;
    status = "error";

    constructor(message: string) {
        super(message);
    }
}
