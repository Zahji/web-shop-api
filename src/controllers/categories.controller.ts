import { Router, Request, Response } from "express";
import { CategoriesService } from "../services/categories.service";
import { NewCategory, Category } from "../models/category.model";
import { isNewCategory, isCategory, isNumber } from "../utils/guards";
import { LoggerService } from "../services/logger.service";
import { DB } from "../services/db.service";

export const categoriesController = Router();

/**
 * GET /categories/
 * Get all categories
 */
categoriesController.get("/", (req: Request, res: Response) => {
  LoggerService.info("[GET] /categories/");

  const idUser = parseInt(req.query.idUser as string);
  const includeUnavailable = req.query.includeUnavailable === "true";

  if (!isNumber(idUser)) {
    LoggerService.error("Bad request: idUser is not a valid number");
    return res.status(400).send("Invalid idUser");
  }

  try {
    const categories = CategoriesService.getAllByUser(idUser, includeUnavailable);
    return res.status(200).json(categories);
  } catch (error : any) {
    if (error.message === "Unauthorized") {
      return res.status(401).send("Not authorized");
    }
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /categories/id
 * Get an categories by id
 */
categoriesController.get("/:id", (req: Request, res: Response) => {
  LoggerService.info("[GET] /categories/:id");

  const id = parseInt(req.params.id);
  const idUser = parseInt(req.query.idUser as string);

  if (!isNumber(id) || !isNumber(idUser)) {
    LoggerService.error("Bad request: invalid id or idUser");
    return res.status(400).send("Invalid id or idUser");
  }

  try {
    const category = CategoriesService.getById(id);
    if (!category) {
      LoggerService.error("Category not found");
      return res.status(404).send("Category not found");
    }

    const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
    if (!user) {
      LoggerService.error("User not found");
      return res.status(401).send("Authentication required");
    }

    if (user.role !== "admin" && category.status !== "AVAILABLE") {
      LoggerService.error("Access denied: not authorized to view unavailable category");
      return res.status(401).send("Not authorized to access this category");
    }

    return res.status(200).json(category);
  } catch (error: any) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /categories/
 * Create a new categories
 * Request body must be a valid categories model
 */
categoriesController.post("/", (req: Request, res: Response) => {
  LoggerService.info("[POST] /categories");

  const idUser = parseInt(req.query.idUser as string);
  const category: NewCategory = req.body;

  if (!isNumber(idUser)) {
    LoggerService.error("Bad request: invalid idUser");
    return res.status(400).send("Invalid idUser");
  }

  const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  if (!user || user.role !== "admin") {
    LoggerService.error("Unauthorized: only admin can create categories");
    return res.status(401).send("Not authorized");
  }

  if (!isNewCategory(category)) {
    LoggerService.error("Bad request: invalid category data");
    return res.status(400).send("Invalid category data");
  }

  try {
    const createdCategory = CategoriesService.insert(category);
    return res.status(200).json(createdCategory);
  } catch (error: any) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /categories/:id
 * Update a categories by id
 * Request body must be a valid categories model
 * */
categoriesController.put("/", (req: Request, res: Response) => {
  LoggerService.info("[PUT] /categories");

  const idUser = parseInt(req.query.idUser as string);
  const category: Category = req.body;

  if (!isNumber(idUser)) {
    LoggerService.error("Bad request: invalid idUser");
    return res.status(400).send("Invalid idUser");
  }

  const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  if (!user || user.role !== "admin") {
    LoggerService.error("Unauthorized: only admin can update categories");
    return res.status(401).send("Not authorized");
  }

  if (!isCategory(category)) {
    LoggerService.error("Bad request: invalid category data");
    return res.status(400).send("Invalid category data");
  }

  const existingCategory = CategoriesService.getById(category.categoryId);
  if (!existingCategory) {
    LoggerService.error("Category not found");
    return res.status(404).send("Category not found");
  }

  try {
    const updated = CategoriesService.update(category);
    return res.status(200).json(updated);
  } catch (error: any) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * SOFT DELETE /categories/:id 
 * Delete a categories by id
 * Request body must be a valid categories model
 * */
categoriesController.delete("/:id", (req: Request, res: Response) => {
  LoggerService.info("[DELETE] /categories/:id");

  const id = parseInt(req.params.id);
  const idUser = parseInt(req.query.idUser as string);

  if (!isNumber(id) || !isNumber(idUser)) {
    LoggerService.error("Bad request: invalid id or idUser");
    return res.status(400).send("Invalid id or idUser");
  }

  const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  if (!user || user.role !== "admin") {
    LoggerService.error("Unauthorized: only admin can delete categories");
    return res.status(401).send("Not authorized");
  }

  const category = CategoriesService.getById(id);
  if (!category) {
    LoggerService.error("Category not found");
    return res.status(404).send("Category not found");
  }

  const success = CategoriesService.softDelete(id);
  return res.status(200).json({ success });
});



