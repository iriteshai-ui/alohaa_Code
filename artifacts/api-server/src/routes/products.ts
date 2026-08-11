import { Router } from "express";
import { ProductsController } from "../controllers/products.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/products", requireAuth, ProductsController.list);
router.post("/products", requireAdmin, ProductsController.create);
router.get("/products/:id", requireAuth, ProductsController.getById);
router.patch("/products/:id", requireAdmin, ProductsController.update);
router.delete("/products/:id", requireAdmin, ProductsController.delete);

export default router;
