import { db, productsTable, ordersTable, usersTable } from "@workspace/db";
import { eq, sql, gte, lt, lte, and } from "drizzle-orm";

export class DashboardService {
  static async getAdminStats() {
    const [{ value: totalProducts }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(productsTable);

    const [{ value: lowStockAlerts }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(lt(productsTable.availableQuantity, 10));

    const [{ value: totalOrders }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(ordersTable);

    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sql<string>`coalesce(sum(grand_total), 0)::text` })
      .from(ordersTable);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [{ todaySales }] = await db
      .select({ todaySales: sql<string>`coalesce(sum(grand_total), 0)::text` })
      .from(ordersTable)
      .where(and(gte(ordersTable.createdAt, startOfToday), lte(ordersTable.createdAt, endOfToday)));

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [{ monthlySales }] = await db
      .select({ monthlySales: sql<string>`coalesce(sum(grand_total), 0)::text` })
      .from(ordersTable)
      .where(and(gte(ordersTable.createdAt, startOfMonth), lte(ordersTable.createdAt, endOfMonth)));

    const [{ value: activeUsers }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.isActive, true));

    return {
      totalProducts,
      lowStockAlerts,
      totalOrders,
      totalRevenue: Number(totalRevenue),
      todaySales: Number(todaySales),
      monthlySales: Number(monthlySales),
      activeUsers,
    };
  }

  static async getUserStats(userId: number) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [{ value: myTodayOrders }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.createdById, userId),
          gte(ordersTable.createdAt, startOfToday),
          lte(ordersTable.createdAt, endOfToday)
        )
      );

    const [{ value: myTotalOrders }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(ordersTable)
      .where(eq(ordersTable.createdById, userId));

    const [{ myTotalRevenue }] = await db
      .select({ myTotalRevenue: sql<string>`coalesce(sum(grand_total), 0)::text` })
      .from(ordersTable)
      .where(eq(ordersTable.createdById, userId));

    return {
      myTodayOrders,
      myTotalOrders,
      myTotalRevenue: Number(myTotalRevenue),
    };
  }

  static async getRecentOrders(limit = 5) {
    const orders = await db
      .select({
        id: ordersTable.id,
        invoiceNumber: ordersTable.invoiceNumber,
        customerName: ordersTable.customerName,
        customerMobile: ordersTable.customerMobile,
        grandTotal: ordersTable.grandTotal,
        paidAmount: ordersTable.paidAmount,
        pendingAmount: ordersTable.pendingAmount,
        status: ordersTable.status,
        createdById: ordersTable.createdById,
        createdByName: usersTable.name,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.createdById, usersTable.id))
      .orderBy(sql`${ordersTable.createdAt} desc`)
      .limit(limit);

    return orders.map((o) => ({
      ...o,
      grandTotal: Number(o.grandTotal),
      paidAmount: Number(o.paidAmount),
      pendingAmount: Number(o.pendingAmount),
    }));
  }

  static async getLowStockProducts() {
    const products = await db
      .select()
      .from(productsTable)
      .where(lt(productsTable.availableQuantity, 10))
      .orderBy(productsTable.availableQuantity);

    return products.map((p) => ({ ...p, price: Number(p.price) }));
  }
}
