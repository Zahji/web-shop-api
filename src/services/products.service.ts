import {
  Product,
  ProductDTO,
  NewProduct,
  ProductStatus,
} from "../models/product.model";
import { DB } from "./db.service";
import { LoggerService } from "./logger.service";

export class ProductsService {
  /**
   * Get all products
   */
  static getAllByUser(
    idUser: number,
    includeUnavailable: boolean
  ): ProductDTO[] {
    // user ?
    const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(
      idUser
    );
    if (!user) {
      LoggerService.error("User not found");
      throw new Error("User not found");
    }

    let req = "SELECT * FROM products";
    const params: any[] = [];

    // admin ?
    if (user.role !== "admin" || !includeUnavailable) {
      req += " WHERE status = 'AVAILABLE'";
    }

    let data;
    try {
      data = DB.prepare(req).all(...params);
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }

    const products: ProductDTO[] = data.map((p: any) => ({
      productId: p.product_id,
      name: p.name,
      price: p.price,
      status: p.status,
    }));

    return products;
  }

  /**
   * Get an product by id
   * @param id the product id
   * @returns the product or undefined if not found
   */
  public static getById(id: number): Product | undefined {
    const req = "SELECT * FROM products WHERE product_id = ?";
    let product;

    try {
      product = DB.prepare(req).get(id);
      console.log("Résultat BDD :", product);
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }

    if (!product) {
      return undefined;
    }

    return {
      productId: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      status: product.status,
      categoryId: product.category,
    };
  }

  /**
   * Create a new product
   * @param product the product to create
   * @returns the created product
   */
  public static insert(product: NewProduct): Product {
    const req = `INSERT INTO products (name, description, price, category, status)
                     VALUES (?, ?, ?, ?, 'AVAILABLE')`;
    let result;
    try {
      result = DB.prepare(req).run(
        product.name,
        product.description,
        product.price,
        product.categoryId
      );
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal error while inserting product");
    }

    return {
      ...product,
      productId: result.lastInsertRowid as number,
      status: ProductStatus.Available,
    };
  }

  /**
   * Update a product by id
   * @param product the product to update
   * @returns the updated product or null if not found
   */
  public static update(product: Product): Product | null {
    const req =
      "UPDATE products " +
      "SET name = ?, description = ?, price = ?, category = ?, status = ? " +
      "WHERE product_id = ?";

    let info;
    try {
      info = DB.prepare(req).run(
        product.name,
        product.description,
        product.price,
        product.categoryId,
        product.status,
        product.productId
      );
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }

    if (info.changes === 0) {
      return null;
    }

    return product;
  }

  /**
   * Delete a product by id
   * @param id the product id
   * @returns true if deleted, false if not found
   */
  static softDelete(id: number): boolean {
    const req = "UPDATE products SET status = 'UNAVAILABLE' WHERE product_id = ?";
    let result;
  
    try {
      result = DB.prepare(req).run(id);
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }
  
    return result.changes > 0;
  }
  
}
