import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/orders", requireAuth, OrdersController.list);
router.post("/orders", requireAuth, OrdersController.create);
router.get("/orders/:id", requireAuth, OrdersController.getById);
router.post("/orders/:id/payments", requireAuth, OrdersController.addPayment);
router.get("/orders/:id/invoice", requireAuth, OrdersController.downloadInvoice);
router.post("/orders/:id/send-email", requireAuth, OrdersController.sendEmail);

export default router;
