import type { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";
import { getSessionUser } from "../middlewares/auth";

export class DashboardController {
  static async adminStats(_req: Request, res: Response): Promise<void> {
    const stats = await DashboardService.getAdminStats();
    res.json(stats);
  }

  static async userStats(req: Request, res: Response): Promise<void> {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const stats = await DashboardService.getUserStats(user.id);
    res.json(stats);
  }

  static async recentOrders(_req: Request, res: Response): Promise<void> {
    const orders = await DashboardService.getRecentOrders(5);
    res.json(orders);
  }

  static async lowStock(_req: Request, res: Response): Promise<void> {
    const products = await DashboardService.getLowStockProducts();
    res.json(products);
  }
}
