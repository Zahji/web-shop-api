import { OrderDTO } from "../models/order.model";
import { OrderItem, OrderItemDTO } from "../models/orderItem.model";
import { DB } from "./db.service";
import { LoggerService } from "./logger.service";

export class OrderItemService {

    public static insert(orderItem: OrderItemDTO): OrderItem {
        let reqOrderItem = 'INSERT INTO order_items ( order_fk , product, quantity ) VALUES (?, ?, ?)';
        let res;
   
        try {
            res = DB.prepare(reqOrderItem).run(orderItem.orderId, orderItem.productId ,orderItem.quantity);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        const newOrderItem : OrderItem ={
            orderId: orderItem.orderId,
            productId: orderItem.productId,
            unitPrice: res.unitPrice,
            quantity: orderItem.quantity
        }
        return newOrderItem;
    }

    public static update(orderItem: OrderItem): OrderItem | undefined{
        let req = 'UPDATE order_items SET quantity = ? WHERE order_fk = ? AND product = ?';
        let verification = 'SELECT * FROM order_items WHERE order_fk = ? AND product = ?';
        let response;
        let reponseVerification;

        try {
            reponseVerification = DB.prepare(verification).get(orderItem.orderId,orderItem.productId);
            response = DB.prepare(req).run(orderItem.quantity, orderItem.orderId, orderItem.productId);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        if(reponseVerification === undefined){
            return undefined;
        }
        
        if(response.change === 0){
            return undefined;
        }

        return orderItem;
    }

    public static delete(orderId: number, productId: number): boolean{
        let req = 'DELETE FROM order_items WHERE order_fk = ? AND product = ?';
        let response;

        try {
            response = DB.prepare(req).run(orderId,productId);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }
        return response.change > 0;
    }

    public static getOrderItems(orderfk: number, productId: number): OrderItem | undefined{
        let req = 'SELECT * FROM order_items WHERE order_fk = ? AND product = ?';
        let res;

        try {
            res = DB.prepare(req).get(orderfk,productId);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        if(res === undefined){
            return undefined;
        }

        const orderItem: OrderItem = {
            orderId: res.order_fk,
            productId: res.product,
            unitPrice: res.unitPrice,
            quantity: res.quantity
        }
        return orderItem;
    }
}