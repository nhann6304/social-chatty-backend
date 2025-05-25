import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export interface IBaseResponse<T> {
    message: string;
    metadata?: T;
    statusCode?: StatusCodes;
    reasonStatusCode?: ReasonPhrases;
}
