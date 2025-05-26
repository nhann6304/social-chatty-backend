import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { availableMemory } from "process";
import { IBaseResponse } from "src/interfaces/core/IBaseResponse.interface";
import { ArrayOverlap } from "typeorm";

export abstract class RESPONSE<T = any> {
    message: string;
    metadata: T | undefined;
    totalItem?: number;
    abstract statusCode: number;
    abstract reasonStatusCode: string;

    send(res: Response) {
        return res.status(this.statusCode).json(this);
    }

    constructor({ message, metadata }: IBaseResponse<T>) {
        this.message = message;
        this.metadata = metadata;
        if (Array.isArray(this.metadata)) {
            this.totalItem = this.metadata.length;
        }
    }
}

export class OK<T = any> extends RESPONSE {
    statusCode: number = StatusCodes.OK;
    reasonStatusCode: string = ReasonPhrases.OK;
    constructor({ message, metadata }: IBaseResponse<T>) {
        super({ message, metadata });
    }
}

export class CREATE<T = any> extends RESPONSE {
    statusCode: number = StatusCodes.CREATED;
    reasonStatusCode: string = ReasonPhrases.CREATED;
    constructor({ message, metadata }: IBaseResponse<T>) {
        super({
            message,
            metadata,
        });
    }
}
