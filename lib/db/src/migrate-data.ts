import pg from "pg";
import { db, pool } from "./index";
import { resetSequences } from "./seed";
import {
  usersTable,
  productsTable,
  inventoryTable,
  ordersTable,
  orderItemsTable,
  orderPaymentsTable,
  sessionTable,
} from "./schema";

const { Pool } = pg;

async function migrateData() {
  const localUrl = process.env.LOCAL_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/inventory_masters";
  console.log(`Connecting to source database: ${localUrl.replace(/:[^:@]+@/, ":***@")}`);

  const sourcePool = new Pool({ connectionString: localUrl });

  try {
    const sourceClient = await sourcePool.connect();
    console.log("Connected to source database. Starting data dump and migration...");

    // 1. Users
    const usersRes = await sourceClient.query("SELECT * FROM users ORDER BY id ASC");
    if (usersRes.rows.length > 0) {
      console.log(`Migrating ${usersRes.rows.length} users...`);
      for (const row of usersRes.rows) {
        await db.insert(usersTable).values({
          id: row.id,
          name: row.name,
          email: row.email,
          username: row.username,
          passwordHash: row.password_hash,
          role: row.role,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }).onConflictDoNothing();
      }
    }

    // 2. Products
    const productsRes = await sourceClient.query("SELECT * FROM products ORDER BY id ASC");
    if (productsRes.rows.length > 0) {
      console.log(`Migrating ${productsRes.rows.length} products...`);
      for (const row of productsRes.rows) {
        await db.insert(productsTable).values({
          id: row.id,
          name: row.name,
          description: row.description,
          price: row.price,
          availableQuantity: row.available_quantity,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }).onConflictDoNothing();
      }
    }

    // 3. Inventory Transactions
    const invRes = await sourceClient.query("SELECT * FROM inventory_transactions ORDER BY id ASC");
    if (invRes.rows.length > 0) {
      console.log(`Migrating ${invRes.rows.length} inventory transactions...`);
      for (const row of invRes.rows) {
        await db.insert(inventoryTable).values({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          previousQuantity: row.previous_quantity,
          quantityAdded: row.quantity_added,
          quantityReduced: row.quantity_reduced,
          currentQuantity: row.current_quantity,
          actionType: row.action_type,
          updatedById: row.updated_by_id,
          updatedAt: row.updated_at,
        }).onConflictDoNothing();
      }
    }

    // 4. Orders
    const ordersRes = await sourceClient.query("SELECT * FROM orders ORDER BY id ASC");
    if (ordersRes.rows.length > 0) {
      console.log(`Migrating ${ordersRes.rows.length} orders...`);
      for (const row of ordersRes.rows) {
        await db.insert(ordersTable).values({
          id: row.id,
          invoiceNumber: row.invoice_number,
          customerName: row.customer_name,
          customerMobile: row.customer_mobile,
          customerEmail: row.customer_email,
          customerAddress: row.customer_address,
          subtotal: row.subtotal,
          gstPercentage: row.gst_percentage,
          gstAmount: row.gst_amount,
          referralCharges: row.referral_charges,
          discount: row.discount,
          grandTotal: row.grand_total,
          paidAmount: row.paid_amount,
          pendingAmount: row.pending_amount,
          paymentMethod: row.payment_method,
          status: row.status,
          createdById: row.created_by_id,
          createdAt: row.created_at,
        }).onConflictDoNothing();
      }
    }

    // 5. Order Items
    const itemsRes = await sourceClient.query("SELECT * FROM order_items ORDER BY id ASC");
    if (itemsRes.rows.length > 0) {
      console.log(`Migrating ${itemsRes.rows.length} order items...`);
      for (const row of itemsRes.rows) {
        await db.insert(orderItemsTable).values({
          id: row.id,
          orderId: row.order_id,
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          unitPrice: row.unit_price,
          total: row.total,
          createdAt: row.created_at,
        }).onConflictDoNothing();
      }
    }

    // 6. Order Payments
    const pmtsRes = await sourceClient.query("SELECT * FROM order_payments ORDER BY id ASC");
    if (pmtsRes.rows.length > 0) {
      console.log(`Migrating ${pmtsRes.rows.length} order payments...`);
      for (const row of pmtsRes.rows) {
        await db.insert(orderPaymentsTable).values({
          id: row.id,
          orderId: row.order_id,
          amount: row.amount,
          paymentMethod: row.payment_method,
          remarks: row.remarks,
          createdById: row.created_by_id,
          createdAt: row.created_at,
        }).onConflictDoNothing();
      }
    }

    sourceClient.release();
    await sourcePool.end();

    console.log("Resetting database auto-increment sequences...");
    await resetSequences();
    console.log("Data migration from local database to Supabase complete!");

  } catch (err) {
    console.error("Data migration error:", err);
    await sourcePool.end();
    process.exit(1);
  }
}

migrateData()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Migration failed:", err);
    await pool.end();
    process.exit(1);
  });
