import express, { Router } from "express";

class AuthRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        this.router.get("/", (req, res) => {
            res.send("Auth route is working!");
        });
        // this.router.post("/signup");
        return this.router;
    }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
