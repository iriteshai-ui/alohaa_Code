import type { Request, Response } from "express";
import { AdjustInventoryBody, ListInventoryQueryParams } from "@workspace/api-zod";
import { InventoryService } from "../services/inventory.service";
import { getSessionUser } from "../middlewares/auth";

export class InventoryController {
  static async list(req: Request, res: Response): Promise<void> {
    const query = ListInventoryQueryParams.safeParse(req.query);
    const search = query.success ? query.data.search : undefined;
    const actionType = (req.query.actionType as string) || undefined;
    const page = query.success && query.data.page ? Number(query.data.page) : 1;
    const limit = query.success && query.data.limit ? Number(query.data.limit) : 20;

    const result = await InventoryService.listTransactions(search, actionType, page, limit);
    res.json(result);
  }

  static async createAdjustment(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const parsed = AdjustInventoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const result = await InventoryService.createAdjustment(
      {
        productId: parsed.data.productId,
        actionType: parsed.data.actionType as "add" | "reduce",
        quantity: parsed.data.quantity,
      },
      user.id
    );

    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.data);
  }
}
