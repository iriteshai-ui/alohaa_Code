import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/dashboard/admin", requireAdmin, DashboardController.adminStats);
router.get("/dashboard/user", requireAuth, DashboardController.userStats);
router.get("/dashboard/recent-orders", requireAuth, DashboardController.recentOrders);
router.get("/dashboard/low-stock", requireAdmin, DashboardController.lowStock);

export default router;
