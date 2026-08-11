import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  static checkRateLimit(ip: string, isLocalhost: boolean): { allowed: boolean; remainingMinutes?: number } {
    const now = Date.now();
    const record = loginAttempts.get(ip);
    const maxAttempts = isLocalhost && process.env.NODE_ENV !== "production" ? 20 : MAX_LOGIN_ATTEMPTS;

    if (record) {
      if (now > record.resetTime) {
        loginAttempts.delete(ip);
      } else if (record.count >= maxAttempts) {
        const remainingMinutes = Math.ceil((record.resetTime - now) / 60000);
        return { allowed: false, remainingMinutes };
      }
    }
    return { allowed: true };
  }

  static recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const current = loginAttempts.get(ip);
    if (current && now <= current.resetTime) {
      current.count += 1;
    } else {
      loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    }
  }

  static clearRateLimit(ip: string): void {
    loginAttempts.delete(ip);
  }

  static async authenticateUser(username: string, password: string, ip: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.username, username), eq(usersTable.email, username)));

    if (!user || !user.isActive) {
      this.recordFailedAttempt(ip);
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      this.recordFailedAttempt(ip);
      return null;
    }

    this.clearRateLimit(ip);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }

  static async getUserById(userId: number) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user || !user.isActive) {
      return { success: false, status: 401, error: "Not authenticated" };
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return { success: false, status: 400, error: "Current password is incorrect" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, user.id));

    return { success: true };
  }
}
