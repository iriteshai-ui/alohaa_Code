import type { Request, Response, NextFunction } from "express";
import { LoginBody } from "@workspace/api-zod";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = ((req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown")
        .split(",")[0]
        .trim();
      const isLocalhost = ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === "unknown";

      const rateLimit = AuthService.checkRateLimit(ip, isLocalhost);
      if (!rateLimit.allowed) {
        res.status(429).json({
          error: `Too many failed login attempts. Please try again in ${rateLimit.remainingMinutes} minute(s).`,
        });
        return;
      }

      const parsed = LoginBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const user = await AuthService.authenticateUser(parsed.data.username, parsed.data.password, ip);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      req.session.destroy(() => {
        res.json({ message: "Logged out" });
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session.userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const user = await AuthService.getUserById(req.session.userId);
      if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.session.userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { currentPassword, newPassword } = req.body || {};

      if (!currentPassword || typeof currentPassword !== "string") {
        res.status(400).json({ error: "Current password is required" });
        return;
      }

      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 4) {
        res.status(400).json({ error: "New password must be at least 4 characters long" });
        return;
      }

      const result = await AuthService.changePassword(req.session.userId, currentPassword, newPassword);
      if (!result.success) {
        res.status(result.status || 400).json({ error: result.error });
        return;
      }

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  }
}
