// error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

export class errorMiddleware {
    static handle(
        error: any,
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        console.error("🔥 Global error:", error);

        const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
        let message = error.message || ReasonPhrases.INTERNAL_SERVER_ERROR;

        if (Array.isArray(message)) {
            message = message[0];
        }

        return res.status(statusCode).json({
            statusCode,
            error: error.error || ReasonPhrases.INTERNAL_SERVER_ERROR,
            message,
            path: req.originalUrl,
            timestamp: new Date().toISOString(),
        });
    }
}
