import { Category } from "./category.model";

export enum ProductStatus {
    Available = "AVAILABLE",
    Unavailable = "UNAVAILABLE",
}
export interface NewProduct {
    name: string;
    description: string;
    price: number;
    categoryId: number;
  }
  
  export interface Product extends NewProduct {
    productId: number;
    status: ProductStatus;
  }

export interface ProductDTO {
    productId : number;
    name : string;
    price : number;
    status : ProductStatus;
}

export interface FullProductDTO extends ProductDTO {
    description : string;
    category : Category;
}


  
