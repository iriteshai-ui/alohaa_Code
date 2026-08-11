import type { Request, Response } from "express";
import {
  CreateOrderBody,
  GetOrderParams,
  ListOrdersQueryParams,
  DownloadInvoiceParams,
  SendInvoiceEmailParams,
} from "@workspace/api-zod";
import { OrdersService } from "../services/orders.service";
import { getSessionUser } from "../middlewares/auth";

export class OrdersController {
  static async list(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const query = ListOrdersQueryParams.safeParse(req.query);
    const result = await OrdersService.listOrders(user, query.success ? query.data : {});
    res.json(result);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const parsed = CreateOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const result = await OrdersService.createOrder(
      {
        ...parsed.data,
        paymentMethod: req.body.paymentMethod,
        createdAt: req.body.createdAt,
      },
      user
    );

    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.data);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const params = GetOrderParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const result = await OrdersService.getOrderById(params.data.id, user);
    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.json(result.data);
  }

  static async addPayment(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = parseInt(idParam as string, 10);
    if (isNaN(orderId)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    const result = await OrdersService.addPayment(orderId, req.body || {}, user);
    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.json(result.data);
  }

  static async downloadInvoice(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const params = DownloadInvoiceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const result = await OrdersService.streamInvoicePdf(params.data.id, user, res);
    if (result && !result.success) {
      res.status(result.status || 400).json({ error: result.error });
    }
  }

  static async sendEmail(req: Request, res: Response): Promise<void> {
    const params = SendInvoiceEmailParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const result = await OrdersService.sendInvoiceEmail(params.data.id);
    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.json({ message: result.message });
  }
}
