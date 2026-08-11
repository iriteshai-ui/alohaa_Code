import { db, productsTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";

export class ProductsService {
  static async listProducts(search?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions = search ? [ilike(productsTable.name, `%${search}%`)] : [];

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(conditions.length ? conditions[0] : undefined);

    const data = await db
      .select()
      .from(productsTable)
      .where(conditions.length ? conditions[0] : undefined)
      .orderBy(productsTable.name)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((p) => ({ ...p, price: Number(p.price) })),
      total: totalRow.count,
      page,
      limit,
    };
  }

  static async getProductById(id: number) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));

    if (!product) return null;
    return { ...product, price: Number(product.price) };
  }

  static async createProduct(data: {
    name: string;
    description?: string;
    price: number | string;
    availableQuantity?: number;
  }) {
    const [product] = await db
      .insert(productsTable)
      .values({
        name: data.name,
        description: data.description ?? "",
        price: String(data.price),
        availableQuantity: data.availableQuantity ?? 0,
      })
      .returning();

    return { ...product, price: Number(product.price) };
  }

  static async updateProduct(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number | string;
      availableQuantity?: number;
    }
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = String(data.price);
    if (data.availableQuantity !== undefined) updateData.availableQuantity = data.availableQuantity;

    const [product] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) return null;
    return { ...product, price: Number(product.price) };
  }

  static async deleteProduct(id: number) {
    const [product] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning();

    return product || null;
  }
}
