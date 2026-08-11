import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/users", requireAdmin, UsersController.list);
router.post("/users", requireAdmin, UsersController.create);
router.patch("/users/:id", requireAdmin, UsersController.update);
router.post("/users/:id/reset-password", requireAdmin, UsersController.resetPassword);

export default router;
