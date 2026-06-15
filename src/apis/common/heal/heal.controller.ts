import { Request, Response } from "express";
import { OK } from "src/core/response.core";

class HealController {
    public async heal(req: Request, res: Response) {
        new OK({
            message: "Health check successful",
        }).send(res);
    }
}

export const healController = new HealController();
