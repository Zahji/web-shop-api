import { Order, OrderDTO, OrderIncludeAllUser, OrderNewStatus, OrderStatus } from "../models/order.model";
import { OrderFilter } from "../models/order.model";
import { UserFilter, UserRole, UserStatus } from "../models/user.model";
import { LoggerService } from "./logger.service";
import { DB } from "./db.service";
import { User } from "../models/user.model";
import { UsersService } from "./users.service";

export class OrdersService {

    /**
     * Get all orders from a user with difference if the user is 
     * a Client or an Administrateur 
     */
    public static getAll(filterOrder: OrderFilter, idUser: number): Order[] {
        let req;
        let orders;
        let values = [];
      
        const userStatus = UsersService.getById(idUser);
        if (!userStatus) {
            throw new Error('Parameters invalid');
        }
        let isWhere = false;
        if (userStatus.role === UserRole.client || filterOrder.includeAllUsers !== "true") {
            req = 'SELECT od.* FROM orders AS od, users AS us WHERE od.client = us.user_id AND us.user_id = ?';
            isWhere = true;
            values.push(idUser);
        } else {
            req = 'SELECT od.* FROM orders AS od';
        }

        if (filterOrder.status !== undefined) {
            if(!isWhere) req += ' WHERE ';
            else req += ' AND ';
            req += 'od.status = ?';
            values.push(filterOrder.status);
        }
       
        try {
            orders = DB.prepare(req).all(values);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        } 
       

        const results: Order[] = [];

        for (const data of orders){
            
                const o: Order = {
                    orderId: data.order_id,
                    client: data.client,
                    orderDate: data.order_date,
                    status: data.status
                }
                results.push(o);
            
            
        };       
      
        return results;         
    }

    public static getById(orderid: number, userFilter: UserFilter): Order | undefined{
        let response;
        let req = 'SELECT o.* FROM orders as o';
        let user;

        if(userFilter.idUser){
            user = UsersService.getById(userFilter.idUser);
        }
                
        try {
            if(user && user.role === UserRole.client){
                req += ',users as us WHERE o.client = us.user_id AND o.client = ? AND o.order_id = ?';
                response = DB.prepare(req).get(user.id,orderid);
            } else if( user && user.role === UserRole.admin){
                req += ' , users as us WHERE o.order_id = ?';
                response = DB.prepare(req).get(orderid);
            }
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        if(!response){
            return undefined;
        }
        

        const o: Order = {
        orderId: response.order_id,
        client: response.client,
        orderDate: response.order_date,
        status: response.status
        }
        return o;        
    }

    public static insert(order : OrderDTO): Order {
        let response;
        let requestOrder = 'Insert Into orders (client , order_date , status) VALUES (?, ?, ?)';
        
        try {
            response = DB.prepare(requestOrder).run(order.client,order.orderDate,order.status);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('internal error');
        }

        const result: Order={
            orderId: response.lastInsertRowid,
            client: order.client,
            orderDate : order.orderDate,
            status: order.status
        };
        return result;       
    }

    public static updateStatusOrder(newStatusOrder: OrderNewStatus, orderId: number): Order | undefined{
        let requestUpdateStatus = 'UPDATE orders SET status = ?, order_date = ? WHERE order_id = ?';
        let requestOrderNewStatus = 'SELECT * FROM orders WHERE order_id = ?';
        let response;
        let updateOrder;
        const newDate = Date();
        
        try {
            response = DB.prepare(requestUpdateStatus).run(newStatusOrder.status,newDate,orderId);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('internal error'); 
        }

        if(response.change === 0){
            return undefined;
        }
        try {
            updateOrder = DB.prepare(requestOrderNewStatus).get(orderId)
        } catch (error) {
            LoggerService.error(error);
            throw new Error('internal error'); 
        }

        const order: Order ={
            orderId: updateOrder.order_id,
            client: updateOrder.class,
            orderDate: updateOrder.order_date,
            status: updateOrder.status
        };
        return order;
    }
    
    public static checkStatus(status: string | undefined): boolean {

        const statusToCheck = status;

        if(statusToCheck === 'NEW'){
            return true;
        }

        if(statusToCheck === 'PROCESSING'){
            return true;
        }

        if(statusToCheck === 'SHIPPED'){
            return true;
        }

        if(statusToCheck === 'DELIVERED '){
            return true;
        }

        if(statusToCheck === 'CANCELLED'){
            return true;
        }
        return false;
    }

    public static updateUnitPrice(orderId: number): boolean{
            const selectItemsQuery = 'SELECT * FROM order_items WHERE order_fk = ?';
            console.log("1");
            const selectPriceQuery = 'SELECT price FROM products WHERE product_id = ?';
            const updatePriceQuery = 'UPDATE order_items SET unit_price = ? WHERE order_fk = ? AND product = ?';
                    console.log("2");

            try {
                const orderItems = DB.prepare(selectItemsQuery).all(orderId);
        
                for (const item of orderItems) {
                    const productRes = DB.prepare(selectPriceQuery).get(item.product);
        
                    if (!productRes) {
                        LoggerService.error("ko");
                        continue;
                    }
        
                    const price = productRes.price;
        
                    DB.prepare(updatePriceQuery).run(price, orderId, item.product);
                }
        
            } catch (error) {
                LoggerService.error(error);
                throw new Error("Failed to finalize order prices");
            }
            return true;
        
    }
}