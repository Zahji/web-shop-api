import { Product } from "./product.model";
import { Order } from "./order.model";

export interface OrderItem {
    orderId : number;
    productId : number;
    unitPrice : number | undefined;
    quantity : number;
}

export interface OrderItemDTO {
    orderId : number;
    productId : number;
    quantity : number;
}

