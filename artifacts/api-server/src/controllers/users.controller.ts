import type { Request, Response } from "express";
import { CreateUserBody, UpdateUserBody, UpdateUserParams } from "@workspace/api-zod";
import { UsersService } from "../services/users.service";

export class UsersController {
  static async list(_req: Request, res: Response): Promise<void> {
    const users = await UsersService.listUsers();
    res.json(users);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const result = await UsersService.createUser(parsed.data);
    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.data);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const params = UpdateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const parsed = UpdateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const result = await UsersService.updateUser(params.data.id, parsed.data);
    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.json(result.data);
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    const params = UpdateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const { password } = req.body || {};
    const result = await UsersService.resetPassword(params.data.id, password);

    if (!result.success) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.json({ message: "Password reset successfully" });
  }
}
