import express, { Router } from "express";
import { healthController } from "src/apis/common/health/health.controller";

class HealthRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.get("/health", healthController.health);
        // this.router.post("/signup");
        return this.router;
    }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();
