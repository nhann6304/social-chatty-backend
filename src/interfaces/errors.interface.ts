export interface IError {
    message: string;
    statusCode: number;
    status: string;
}

export interface IErrorResponse {
    message: string;
    statusCode: number;
    status: string;
    serializeErrors(): IError;
}
