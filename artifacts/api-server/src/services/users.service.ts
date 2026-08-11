import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

export class UsersService {
  static async listUsers() {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        username: usersTable.username,
        role: usersTable.role,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .orderBy(usersTable.name);

    return users;
  }

  static async createUser(data: {
    name: string;
    username: string;
    email?: string;
    password?: string;
    role?: string;
  }) {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(
        data.email
          ? or(eq(usersTable.username, data.username), eq(usersTable.email, data.email))
          : eq(usersTable.username, data.username)
      );

    if (existing) {
      return { success: false, status: 400, error: "Username or email already exists" };
    }

    const rawPass = data.password || "user123";
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const [user] = await db
      .insert(usersTable)
      .values({
        name: data.name,
        username: data.username,
        email: data.email ?? null,
        passwordHash,
        role: data.role || "user",
        isActive: true,
      })
      .returning();

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  static async updateUser(
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    }
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [user] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) {
      return { success: false, status: 404, error: "User not found" };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  static async resetPassword(id: number, newPassword?: string) {
    const rawPass = newPassword || "user123";
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const [user] = await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) {
      return { success: false, status: 404, error: "User not found" };
    }

    return { success: true };
  }
}
