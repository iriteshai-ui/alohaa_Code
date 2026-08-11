import { db, inventoryTable, productsTable, usersTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";

export class InventoryService {
  static async listTransactions(
    search?: string,
    actionType?: string,
    page = 1,
    limit = 20
  ) {
    const offset = (page - 1) * limit;
    const conditions: ReturnType<typeof eq>[] = [];

    if (search) {
      conditions.push(ilike(inventoryTable.productName, `%${search}%`) as ReturnType<typeof eq>);
    }
    if (actionType && ["add", "reduce", "order"].includes(actionType)) {
      conditions.push(eq(inventoryTable.actionType, actionType) as ReturnType<typeof eq>);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryTable)
      .where(whereClause);

    const data = await db
      .select({
        id: inventoryTable.id,
        productId: inventoryTable.productId,
        productName: inventoryTable.productName,
        previousQuantity: inventoryTable.previousQuantity,
        quantityAdded: inventoryTable.quantityAdded,
        quantityReduced: inventoryTable.quantityReduced,
        currentQuantity: inventoryTable.currentQuantity,
        actionType: inventoryTable.actionType,
        updatedById: inventoryTable.updatedById,
        updatedByName: usersTable.name,
        updatedAt: inventoryTable.updatedAt,
      })
      .from(inventoryTable)
      .leftJoin(usersTable, eq(inventoryTable.updatedById, usersTable.id))
      .where(whereClause)
      .orderBy(sql`${inventoryTable.updatedAt} desc`)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: totalRow.count,
      page,
      limit,
    };
  }

  static async createAdjustment(
    data: {
      productId: number;
      actionType: "add" | "reduce";
      quantity: number;
    },
    updatedById: number
  ) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.productId));

    if (!product) {
      return { success: false, status: 404, error: "Product not found" };
    }

    const prevQty = product.availableQuantity;
    let newQty = prevQty;
    let qtyAdded: number | null = null;
    let qtyReduced: number | null = null;

    if (data.actionType === "add") {
      newQty = prevQty + data.quantity;
      qtyAdded = data.quantity;
    } else if (data.actionType === "reduce") {
      if (prevQty < data.quantity) {
        return {
          success: false,
          status: 400,
          error: `Cannot reduce ${data.quantity} units. Available: ${prevQty}`,
        };
      }
      newQty = prevQty - data.quantity;
      qtyReduced = data.quantity;
    }

    await db
      .update(productsTable)
      .set({ availableQuantity: newQty })
      .where(eq(productsTable.id, data.productId));

    const [tx] = await db
      .insert(inventoryTable)
      .values({
        productId: product.id,
        productName: product.name,
        previousQuantity: prevQty,
        quantityAdded: qtyAdded,
        quantityReduced: qtyReduced,
        currentQuantity: newQty,
        actionType: data.actionType,
        updatedById,
      })
      .returning();

    return { success: true, data: tx };
  }
}
