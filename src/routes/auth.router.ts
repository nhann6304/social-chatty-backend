import express, { Router } from "express";
import { authController } from "src/apis/common/auth/auth.controller";
import { CreateUserDto } from "src/apis/common/auth/auth.dto";
import { validateDto } from "src/helper/dtoValidate.helper";

class AuthRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.post("/", validateDto(CreateUserDto), authController.create);
        // this.router.post("/signup");
        return this.router;
    }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
