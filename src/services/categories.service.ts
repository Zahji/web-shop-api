import { Category, CategoryStatus } from "../models/category.model";
import { DB } from "./db.service";
import { LoggerService } from "./logger.service";
import { NewCategory, } from "../models/category.model";


export class CategoriesService {
  /**
   * Get all categories
   * @returns all categories
   */
  public static getAllByUser(idUser: number, includeUnavailable: boolean): Category[] {
    const user = DB.prepare("SELECT * FROM users WHERE user_id = ?").get(idUser);
  
    if (!user) {
      LoggerService.error("User not found");
      throw new Error("Unauthorized");
    }
  
    let req = "SELECT * FROM categories";
    const params: any[] = [];
  
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
  
    return data.map((c: any) => ({
      categoryId: c.category_id,
      name: c.name,
      status: c.status,
    }));
  }
  
  
  /**
   * Get a category by its ID
   * @param id category id
   * @returns the category or undefined if not found
   */
  public static getById(id: number): Category | undefined {
  const req = "SELECT * FROM categories WHERE category_id = ?";
  let category;

  try {
    category = DB.prepare(req).get(id);
  } catch (error) {
    LoggerService.error(error);
    throw new Error("Internal Error");
  }

  if (!category) return undefined;

  return {
    categoryId: category.category_id,
    name: category.name,
    description: category.description,
    status: category.status,
  };
}


  /**
   * Create a new category
   * @param appointment the category to create
   * @returns the created category
   */
  public static insert(category: NewCategory): Category {
    const req = `INSERT INTO categories (name, description, status)
                 VALUES (?, ?, 'AVAILABLE')`;
    let result;
  
    try {
      result = DB.prepare(req).run(category.name, category.description);
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }
  
    return {
      categoryId: result.lastInsertRowid as number,
      name: category.name,
      description: category.description,
      status: CategoryStatus.Available, 
    };
  }

  /**
   * Update a category
   * @param id the category id
   * @param category the category to update
   * @returns the updated category
   */
  public static update(category: Category): Category | null {
    const req = `
      UPDATE categories
      SET name = ?, description = ?, status = ?
      WHERE category_id = ?
    `;
  
    let result;
    try {
      result = DB.prepare(req).run(
        category.name,
        category.description,
        category.status,
        category.categoryId
      );
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }
  
    return result.changes > 0 ? category : null;
  }

  /**
   * Soft delete a category
   * @param id the category id
   * @returns true if the category was deleted, false otherwise
   */
  public static softDelete(id: number): boolean {
    const req = "UPDATE categories SET status = 'UNAVAILABLE' WHERE category_id = ?";
    let result;
  
    try {
      result = DB.prepare(req).run(id);
  
      DB.prepare(`
        UPDATE products
        SET status = 'UNAVAILABLE'
        WHERE category = ?
      `).run(id);
  
    } catch (error) {
      LoggerService.error(error);
      throw new Error("Internal Error");
    }
  
    return result.changes > 0;
  }
  
  
  
  
}
