import { Request, Response } from "express";
import { OK } from "src/core/response.core";

class HealthController {
    public async health(req: Request, res: Response) {
        new OK({
            message: "Health check successful",
        }).send(res);
    }
}

export const healthController = new HealthController();
