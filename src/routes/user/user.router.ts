import express, { Router } from "express";
import { userController } from "src/apis/common/user/user.controller";
import { CreateUserDto } from "src/apis/common/user/user.dto";
import { validateDto } from "src/helper/dtoValidate.helper";

class UserRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.post(
            "/users",
            validateDto(CreateUserDto),
            userController.create,
        );
        this.router.get("/users/findMulti", userController.findAll);
        // Tìm kiếm + lọc + phân trang qua Elasticsearch
        this.router.get("/users/search", userController.search);
        this.router.get("/users/findOne/:id", userController.findOne);
        return this.router;
    }
}

export const userRoutes: UserRoutes = new UserRoutes();
