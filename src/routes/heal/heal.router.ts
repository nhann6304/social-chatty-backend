import express, { Router } from "express";
import { healController } from "src/apis/common/heal/heal.controller";

class HealRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.get("/heal", healController.heal);
        // this.router.post("/signup");
        return this.router;
    }
}

export const healRoutes: HealRoutes = new HealRoutes();
