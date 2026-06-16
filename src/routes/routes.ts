import { Application } from "express";
import { AuthRouter, UserRouter, HealRouter } from ".";

const BASE_PATH = "/api/v1";

export default (app: Application) => {
    const routes = () => {
        app.use(BASE_PATH, AuthRouter.authRoutes.routes());
        //
        app.use(BASE_PATH, UserRouter.userRoutes.routes());
        //
        app.use(BASE_PATH, HealRouter.healthRoutes.routes());
    };
    routes();
};
