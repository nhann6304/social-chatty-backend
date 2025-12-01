import express, { Router } from "express";
import { authController } from "src/apis/common/auth/auth.controller";
import { CreateUserDto } from "src/apis/common/auth/auth.dto";
import { authService } from "src/apis/common/auth/auth.service";
import { validateDto } from "src/helper/dtoValidate.helper";

class AuthRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.post("/register", validateDto(CreateUserDto), authController.register);

        this.router.get("/", authController.hello);
        // this.router.post("/signup");
        return this.router;
    }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
