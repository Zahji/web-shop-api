import { User } from "./user.model";

export enum OrderStatus {
    NEW = "NEW",
    PROCESSING = "PROCESSING", 
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED", 
    CANCELED = "CANCELLED"
}

export enum OrderIncludeAllUser {
    true = "true",
}

export interface Order {
    orderId : number;
    client : number;
    orderDate : Date | undefined;
    status : OrderStatus;
}
export interface OrderFilter {
    status ?: string; 
    client ?: number;
    includeAllUsers ?: OrderIncludeAllUser;
}

export interface OrderDTO {
    client : number;
    orderDate? : Date | undefined;
    status : OrderStatus;
}

export interface OrderFULLDTO{
    orderId: number;
    idClient: number;
    client: User;
    orderDate: Date | undefined;
    status: OrderStatus;
}

export interface OrderNewStatus{
    status: OrderStatus;
}