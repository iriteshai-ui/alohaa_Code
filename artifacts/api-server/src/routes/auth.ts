import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/auth/login", AuthController.login);
router.post("/auth/logout", AuthController.logout);
router.get("/auth/me", AuthController.me);
router.post("/auth/change-password", AuthController.changePassword);

export default router;
