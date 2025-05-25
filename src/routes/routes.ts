import { Application } from "express";
import { authRoutes } from "./auth.router";

const BASE_PATH = "/api/v1";

export default (app: Application) => {
    const routes = () => {
        app.use(BASE_PATH, authRoutes.routes());
    };
    routes();
};
