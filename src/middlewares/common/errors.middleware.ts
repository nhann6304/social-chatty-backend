import { Application, Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { CustomError } from "src/abstracts/common/ACustomError.abstract"; // đường dẫn đến CustomError của bạn

// Hàm chính dùng để gọi ở app.ts
export function registerGlobalErrorHandler(app: Application): void {
    // Middleware 1: Route không tồn tại
    app.all("*", (req: Request, res: Response) => {
        res.status(StatusCodes.NOT_FOUND).json({
            message: `${req.originalUrl} - Đường dẫn không tồn tại`,
            status: "fail",
        });
    });

    // Middleware 2: Xử lý lỗi (phải có 4 tham số để Express hiểu đây là error handler)
    app.use(((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof CustomError) {
            return res.status(err.statusCode).json(err.serializeErrors());
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: err.message || "Lỗi hệ thống",
            status: "Error",
        });
    }) as (err: Error, req: Request, res: Response, next: NextFunction) => void);
}
