import { Router, Request, Response } from "express";
import { ProductsService } from "../services/products.service";
import { LoggerService } from "../services/logger.service";
import {
  Product,
  ProductDTO,
  FullProductDTO,
  NewProduct,
} from "../models/product.model";
import { isNumber, isNewProduct, isProduct } from "../utils/guards";
import { CategoriesService } from "../services/categories.service";
import { DB } from "../services/db.service";

export const productsController = Router();

/**
 * GET /products/
 * Get all products
 */
productsController.get("/", (req: Request, res: Response) => {
  LoggerService.info("[GET] /products/");
  try {
    const idUser = parseInt(req.query.idUser as string);
    const includeUnavailable = req.query.includeUnavailable === "true";

    if (!isNumber(idUser)) {
      LoggerService.error("Bad request: idUser is not a valid number");
      return res.status(400).send();
    }

    const products = ProductsService.getAllByUser(idUser, includeUnavailable);

    return res.status(200).json(products);
  } catch (error) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /products/id
 * Get an products by id
 */
productsController.get("/:id", (req: Request, res: Response) => {
  LoggerService.info("[GET] /products/:id");

  const id = parseInt(req.params.id);
  const idUser = parseInt(req.query.idUser as string);

  if (!isNumber(id) || !isNumber(idUser)) {
    LoggerService.error("Bad request: id or idUser is not a valid number");
    return res.status(400).send("Invalid id or idUser");
  }

  try {
    const product = ProductsService.getById(id);
    if (!product) {
      LoggerService.error("Product not found");
      return res.status(404).send("Product not found");
    }

    const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(
      idUser
    );
    if (!user) {
      LoggerService.error("User not found");
      return res.status(401).send("Authentication required");
    }

    if (user.role !== "admin" && product.status !== "AVAILABLE") {
      LoggerService.error(
        "Access denied: not authorized to view unavailable product"
      );
      return res.status(401).send("Not authorized to access this product");
    }

    const result: ProductDTO = {
      productId: product.productId,
      name: product.name,
      price: product.price,
      status: product.status,
    };

    return res.status(200).json(result);
  } catch (error) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /products/:id/full
 * Get a full product by id
 */

productsController.get("/:id/full", (req: Request, res: Response) => {
  LoggerService.info("[GET] /products/:id/full");

  const id = parseInt(req.params.id);
  const idUser = parseInt(req.query.idUser as string);

  if (!isNumber(id) || !isNumber(idUser)) {
    LoggerService.error("Bad request: id or idUser is not valid");
    return res.status(400).send("Invalid id or idUser");
  }

  try {
    const product = ProductsService.getById(id);
    if (!product) {
      LoggerService.error("Product not found");
      return res.status(404).send("Product not found");
    }

    const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(
      idUser
    );
    if (!user) {
      LoggerService.error("User not found");
      return res.status(401).send("Authentication required");
    }

    if (user.role !== "admin" && product.status !== "AVAILABLE") {
      LoggerService.error(
        "Access denied: not authorized to view unavailable product"
      );
      return res.status(401).send("Not authorized to access this product");
    }

    const category = CategoriesService.getById(product.categoryId);
    if (!category) {
      LoggerService.error("Category not found");
      return res.status(404).send("Category not found");
    }

    const fullProduct: FullProductDTO = {
      productId: product.productId,
      name: product.name,
      price: product.price,
      description: product.description,
      status: product.status,
      category: category,
    };

    return res.status(200).json(fullProduct);
  } catch (error) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /products
 * Create a new product
 * Request body must be a valid new product model
 * */
productsController.post("/", (req: Request, res: Response) => {
  LoggerService.info("[POST] /products");

  const idUser = parseInt(req.query.idUser as string);
  const newProduct: NewProduct = req.body;

  if (!isNumber(idUser)) {
    LoggerService.error("Bad request: idUser is invalid");
    return res.status(400).send("Invalid idUser");
  }

  const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  if (!user || user.role !== "admin") {
    LoggerService.error("Unauthorized: only admin can create products");
    return res.status(401).send("Not authorized");
  }

  if (!isNewProduct(newProduct)) {
    LoggerService.error("Bad request: invalid product model");
    return res.status(400).send("Invalid product data");
  }

  try {
    const createdProduct: Product = ProductsService.insert(newProduct);
    return res.status(200).json(createdProduct);
  } catch (error) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


/**
 * PUT /products
 * Update an existing product
 * Request body must be a valid product model
 * */
productsController.put("/", (req: Request, res: Response) => {
  LoggerService.info("[PUT] /products");

  const idUser = parseInt(req.query.idUser as string);
  const product = req.body;

  if (!isNumber(idUser)) {
    LoggerService.error("Bad request: idUser is invalid");
    return res.status(400).send("Invalid idUser");
  }

  const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  if (!user || user.role !== "admin") {
    LoggerService.error("Unauthorized: only admin can update products");
    return res.status(401).send("Not authorized");
  }

  if (product.id && !product.productId) {
    product.productId = product.id;
  }
  
  if (!isProduct(product)) {
    LoggerService.error("Bad request: invalid product model");
    return res.status(400).send("Invalid product data");
  }

  const existingProduct = ProductsService.getById(product.productId);
  if (!existingProduct) {
    LoggerService.error("Product not found");
    return res.status(404).send("Product not found");
  }

  try {
    const updatedProduct = ProductsService.update(product);
    return res.status(200).json(updatedProduct);
  } catch (error) {
    LoggerService.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * SOFT DELETE /products/:id
 * Soft delete a product by id
 */
productsController.delete("/:id", (req: Request, res: Response) => {
  LoggerService.info("[DELETE] /products/:id");

  const id = parseInt(req.params.id);
  const idUser = parseInt(req.query.idUser as string);

  if (!isNumber(id) || !isNumber(idUser)) {
    LoggerService.error("Bad request: invalid id or idUser");
    return res.status(400).send("Invalid id or idUser");
  }

  const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  if (!user || user.role !== "admin") {
    LoggerService.error("Unauthorized: only admin can delete products");
    return res.status(401).send("Not authorized");
  }

  const product = ProductsService.getById(id);
  if (!product) {
    LoggerService.error("Product not found");
    return res.status(404).send("Product not found");
  }

  const success = ProductsService.softDelete(id);
  return res.status(200).json({ success });
});
