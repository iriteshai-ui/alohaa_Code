import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/inventory", requireAuth, InventoryController.list);
router.post("/inventory", requireAdmin, InventoryController.createAdjustment);

export default router;
