import { Application } from "express";
import { authRoutes } from "./auth.router";
import { CONST_APIS } from "src/constants/constAPI";

const BASE_PATH = "/api/v1";

const TAG_API = CONST_APIS.CONST_API_CONTROLLERS.AUTH;

export default (app: Application) => {
    const routes = () => {
        app.use(`${BASE_PATH}/${TAG_API}`, authRoutes.routes());
    };
    routes();
};
