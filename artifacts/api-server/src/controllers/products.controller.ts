import type { Request, Response } from "express";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";
import { ProductsService } from "../services/products.service";

export class ProductsController {
  static async list(req: Request, res: Response): Promise<void> {
    const query = ListProductsQueryParams.safeParse(req.query);
    const search = query.success ? query.data.search : undefined;
    const page = query.success && query.data.page ? Number(query.data.page) : 1;
    const limit = query.success && query.data.limit ? Number(query.data.limit) : 20;

    const result = await ProductsService.listProducts(search, page, limit);
    res.json(result);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const params = GetProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const product = await ProductsService.getProductById(params.data.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const product = await ProductsService.createProduct(parsed.data);
    res.status(201).json(product);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const params = UpdateProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const product = await ProductsService.updateProduct(params.data.id, parsed.data);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const deleted = await ProductsService.deleteProduct(params.data.id);
    if (!deleted) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.sendStatus(204);
  }
}
