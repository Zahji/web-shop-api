import { Router } from "express";
import { Request, Response } from "express";
import { LoggerService } from "../services/logger.service";
import { Order, OrderDTO, OrderFilter, OrderFULLDTO, OrderIncludeAllUser, OrderNewStatus, OrderStatus } from "../models/order.model";
import { error } from "console";
import { isIdentifier, isNumber, isOrder, isOrderItem, isString, isUser } from "../utils/guards";
import { fileURLToPath } from "url";
import { OrdersService } from "../services/orders.service";
import { UsersService } from "../services/users.service";
import { User, UserFilter, UserRole, UserStatus } from "../models/user.model";
import { ProductsService } from "../services/products.service";
import { OrderItemService } from "../services/ordersItem.service";
import { OrderItem, OrderItemDTO } from "../models/orderItem.model";
import { Product } from "../models/product.model";
import { readSync } from "fs";

export const ordersController = Router();

/**
 * Create an order 
 * @returns the order created
 */
ordersController.post('/', (req: Request, res: Response) =>{
    LoggerService.info('[POST] : /orders/');
    let idUser = req.query.idUser;

    if(!isString(idUser)){   
        LoggerService.error('Id must be a number');
        return res.status(400).send("Id must be a number");  
    }
    const id = parseInt(idUser);

    const user = UsersService.getById(id);
    //check if the user exist
    if(user === undefined){
        LoggerService.error('authentication error');
       return res.status(401).send('authentication error');       
    }

    //check that the status of the user is not disabled
    if(user !== undefined){
        if(user.status === UserStatus.DISABLED){
            LoggerService.error('Access denied');
            return res.status(401).send("Access denied");   
        }
    }
    
    //check if the user is not DISABLED
    if(user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }

    const order: OrderDTO = {
        client : id,
        status: OrderStatus.NEW       
    }

    const result = OrdersService.insert(order);
    return res.status(200).json(result);
});

/**
 * Get all the order whene it is an admin, and the order af a specific 
 * user whene the user is a client 
 * @returns orders
 */
ordersController.get('/', (req: Request, res: Response) =>{
    LoggerService.info('[GET] : /orders/');
    const filterOrder :  OrderFilter = {};
    const status = req.query.status;
    const idUserString = req.query.idUser;
    const includeAllUsers = req.query.includeAllUser;
    let idUser;

    if (isString(idUserString)) {
        idUser = parseInt(idUserString);
    }
    if (!isIdentifier(idUser)) {
        return res.status(400).send('Invalid parameter: Id must be a number');
    }
    
    if(isString(status)){
        filterOrder.status = status;
    }
    
    //check if the new status is one of those : NEW, PROCESSING, SHIPPED, DELIVERED and CANCELED
    let statusString = OrdersService.checkStatus(filterOrder.status); 
    if(statusString === false || statusString === undefined){
        LoggerService.error('The status must be NEW, PROCESSING, SHIPPED, DELIVERED or CANCELED');
        return res.status(400).send('The status must be NEW, PROCESSING, SHIPPED, DELIVERED or CANCELED'); 
    }

    if(isString(includeAllUsers)){
        if(includeAllUsers === OrderIncludeAllUser.true){
            filterOrder.includeAllUsers = OrderIncludeAllUser.true;
        } 
    }
    
    //check if a client does not get an order of an other user
    const user = UsersService.getById(idUser);

    //check if the user exist
    if(user === undefined){
        LoggerService.error('invalid data : idUser does not exist');
        return res.status(401).send('invalid data : idUser does not exist');    
    }

    if(user !== undefined && user.role === UserRole.client && filterOrder.includeAllUsers === OrderIncludeAllUser.true){
        LoggerService.error('Access denied');
        return res.status(401).send('access denied');     
    }

    //check if the user is not DISABLED
    if(user !== undefined && user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send('Access denied');  
    }
    
    const response = OrdersService.getAll(filterOrder, idUser);
    return res.status(200).json(response);
    
});

/**
 * Get basic information of an order of a client, if it is the admin he can get 
 * which one he want  
 * user whene the user is a client 
 * @returns one order
 */
ordersController.get('/:id', (req: Request, res: Response) =>{
    LoggerService.info('[GET] : /orders/:id');
    const filterUser : UserFilter = {};
    const orderId = parseInt(req.params.id);
    const userIdString = req.query.idUser;
    let userIdNumber = 0;

    //check if orderId is a number (not negative, ...)
    if(!isIdentifier(orderId)){
        LoggerService.error('orderId must be a number');
        return res.status(400).send('orderId must be a number');        
    }
    if(isString(userIdString)){
        userIdNumber = parseInt(userIdString);
        if(isIdentifier(userIdNumber)){
            filterUser.idUser = userIdNumber;
        }
    }
    
    //check if the user exist
    const user = UsersService.getById(userIdNumber)
    if(user === undefined){
        LoggerService.error('Invalid id : User not found');
        return res.status(400).send('Invalid id : User not found');
    }

    //check if the user is not DISABLED
    if(user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }
    
    const order = OrdersService.getById(orderId,filterUser);
    //check if the idUser and the client in order is the same when the user is a client
    if(order !== undefined && order.client !== user.id && user.role === UserRole.client){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");   
    }

    //check if the order exist
    if( order === undefined) {
        LoggerService.error('Order not found');
        return res.status(404).send('Order not found');
    }

    return res.status(200).json(order);
});

/**
 * Get detailed information of an order of a client, if it is the admin he can get 
 * which one he want  
 * @returns one order
 */
ordersController.get('/:id/full', (req: Request, res: Response) =>{
    LoggerService.info('[GET] : /orders/:id/full');

    const filterUser: UserFilter = {};
    const orderId = parseInt(req.params.id);
    const userIdString = req.query.idUser;

    if(!isString(userIdString)){
        LoggerService.error('Invalid Id');
        return res.status(400).send('Invalid Id');
    }
    const userIdNumber = parseInt(userIdString);
    if(!isIdentifier(userIdNumber)){
        LoggerService.error('Invalid Id  : Id must be a number');
        return res.status(400).send('Invalid Id : Id must be a number');
    }
    filterUser.idUser = userIdNumber;

    const order = OrdersService.getById(orderId, filterUser);
    //check if the order is creat 
    //and also if the idUser exist or match with the client in order 
    //because getById user idUser
    if(order === undefined){
        LoggerService.error('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
        return res.status(404).send('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
    }

    const user = UsersService.getById(order.client);
    //check if the user exist
    if(user === undefined){
        LoggerService.error('Invalid id : User not found');
        return res.status(404).send('Invalid id : User not found');
    }

    //check if a client does not get an order of an other user
    if(user.id !== order.client && user.role === UserRole.client){
        LoggerService.error('Access denied');
        return res.status(401).send('Access denied');
    }
    
    //check if the user is not DISABLED
    if(user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }
    
    const result : OrderFULLDTO ={
        orderId: order.orderId,
        idClient: order.client,
        client: user,
        orderDate: order.orderDate,
        status: order.status
    }


    return res.status(200).json(result);
});

/**
 *  create an orderItem 
 * @returns an orderItem
 */
ordersController.post('/items', (req: Request, res: Response) =>{
    LoggerService.info('[POST] : /orders/items');
    const UserFilter : UserFilter = {};
    const userIdString = req.query.idUser;
    let userIdNumber;
    const orderItemBody: OrderItemDTO = req.body; 

    if(!isOrderItem(orderItemBody)){
        LoggerService.error('invalid data in orderItem');
        return res.status(400).send('invalid data in orderItem');
    }

    if(isString(userIdString)){
        userIdNumber = parseInt(userIdString);
        if(isIdentifier(userIdNumber))
            UserFilter.idUser = userIdNumber;
    }

    //check if the order is creat 
    //and also if the idUser exist or match with the client in order 
    //because getById user idUser
    const order = OrdersService.getById(orderItemBody.orderId,UserFilter);
    if(order === undefined){
        LoggerService.error('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
        return res.status(404).send('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
    }
     
    //check if the product exist
    const product = ProductsService.getById(orderItemBody.productId);
    if (product === undefined){
        LoggerService.error('Product not found');
        return res.status(404).send('Product not found');
    }

    const orderStatus = OrdersService.getById(orderItemBody.orderId,UserFilter);
    //check if the order is not finelized yet
    if(orderStatus !== undefined ){
        if(orderStatus.status !== OrderStatus.NEW){
            LoggerService.error('order already finalized');
            return res.status(409).send('order already finalized');
        }
    }

    
    const orderItem = OrderItemService.getOrderItems(orderItemBody.orderId,orderItemBody.productId);
    //check if the orderItem exist 
    if(orderItem !== undefined){
        LoggerService.error('orderItem already add');
        return res.status(409).send('orderItem already add');
    }

    const user = UsersService.getById(order.client);
    //check if a user does not creat an orderItem in an order of an other user
    if(user !== undefined && userIdNumber !== order.client && user.role === UserRole.client){
        LoggerService.error('Access denied');
        return res.status(401).send('Access denied');
    }

     //check if the user is not DISABLED
    if(user !== undefined && user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }

    OrderItemService.insert(orderItemBody);
    return res.status(200).send();
});

/**
 * modify the quantity of orderItem
 * @returns the orderItem modify 
 */
ordersController.put('/items', (req: Request, res: Response) =>{
    LoggerService.info('[POST] : /orders/items/post');

    const userFilter : UserFilter = {};
    const orderItemBody : OrderItem = req.body;
    const userIdString = req.query.idUser;
    let idUserNumber;

    if(!isOrderItem(orderItemBody)){
        LoggerService.error('Invalid data');
        return res.status(400).send('Invalid data');        
    }
    if(isString(userIdString)){
        idUserNumber = parseInt(userIdString);
        if(isIdentifier(idUserNumber))
            userFilter.idUser = idUserNumber;
    }

    const order = OrdersService.getById(orderItemBody.orderId,userFilter);
    
    //check if the order is creat 
    //and also if the idUser exist or match with the client in order 
    //because getById user idUser
    if(order === undefined){
        LoggerService.error('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
        return res.status(404).send('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
    }

    //Check if the idUser is the same in order.client
    if(idUserNumber !== order.client){
        LoggerService.error('access not allowed');
        return res.status(401).send('access not allowed');
    }

    //check if the starting status is NEW
    if(order.status !== OrderStatus.NEW){
        LoggerService.error('order already finalized');
        return res.status(409).send('order already finalized');
    }
    
    const product: Product | undefined = ProductsService.getById(orderItemBody.productId);
    //Check if the product exist
    if(product === undefined){
        LoggerService.error('Product does not exist');
        return res.status(404).send('Product does not exist');
    }

    const user = UsersService.getById(idUserNumber);
    //check if the user is not DISABLED
    if(user !== undefined && user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }

    const updateOrderItem = OrderItemService.update(orderItemBody);
    //check if the product is already add
    if(!updateOrderItem){
        LoggerService.error('Product not already add');
        return res.status(404).send('Product not already add');
    }
    return res.status(200).send();
});

/**
 * delete an ordeItem form an order
 * @returns true when the orderItem is delete, orherwise false
 */
ordersController.delete('/:id/items/:idItem', (req: Request, res: Response) =>{
    LoggerService.info('[POST] : /orders/:id/items/:idItem');
    const filterUser: UserFilter = {};
    const orderId = parseInt(req.params.id);
    const productId = parseInt(req.params.idItem);
    const idUserString = req.query.idUser;
    let idUserNumber: number = 0;

    //Verification of data and add idUser to filter
    if(!isString(idUserString)){
        LoggerService.error('invalid data');
        return res.status(400).send('invalid data');
    }
    idUserNumber = parseInt(idUserString);
    if(!isIdentifier(idUserNumber)){
        LoggerService.error('invalid data : id must be a positive number');
        return res.status(400).send('invalid data : id must be a positive number');
    }
    filterUser.idUser = idUserNumber;

    //check if the order is creat 
    //and also if the idUser exist or match with the client in order 
    //because getById user idUser
    const order = OrdersService.getById(orderId,filterUser);
    if(order === undefined){
        LoggerService.error('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
        return res.status(404).send('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
    }

    //check if the order is not finalized yet
    if(order.status !== OrderStatus.NEW){
        LoggerService.error('Order already finalized');
        return res.status(409).send('Order already finalized');        
    }

    //check if the product is not add yet
    const product: Product | undefined = ProductsService.getById(productId);
    if(product === undefined){
        LoggerService.error('Product do not exist');
        return res.status(404).send('Product do not exist');
    }

    const orderItem = OrderItemService.getOrderItems(orderId,productId);
    //check if the orderItem exist
    if(orderItem === undefined){
        LoggerService.error('Product not already add');
        return res.status(404).send('Product not already add'); 
    }

    //check if the user delete his/her order
    const user: User | undefined = UsersService.getById(idUserNumber);
    if(user === undefined){
        LoggerService.error('authentication error');
        return res.status(401).send('authentication error');
    }

    //check if the status before deletion is NEW
    if(user.role === UserRole.client && order.status !== OrderStatus.NEW){
        LoggerService.error('access not allowed');
        return res.status(401).send('access not allowed');
    }

    //check if the user is not DISABLED
    if(user !== undefined && user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }
    
    const result = OrderItemService.delete(orderId,productId);
    if(result){
        LoggerService.error('access not allowed');
        return res.status(401).send('access not allowed');
    }
    return res.status(204).send();

});

/**
 * delete an order by modify his status. 
 * To PROCESSING whene it is a client, and the admin can choose
 * @returns the order delete 
 */
ordersController.put('/:id/status', (req: Request, res: Response) =>{
    LoggerService.info('[POST] : /orders/:id/status');
    const userFilter : UserFilter = {};
    const newStatusBody: OrderNewStatus = req.body;
    const orderId = parseInt(req.params.id);
    const userIdString = req.query.idUser;
    let userIdNumber: number = 0;

    if(isString(userIdString)){
        userIdNumber = parseInt(userIdString);
        if(isIdentifier(userIdNumber)){
            userFilter.idUser = userIdNumber;
        }
    }


    const user = UsersService.getById(userIdNumber);
    const order = OrdersService.getById(orderId,userFilter);

    //check if userid exist 
    if(user === undefined){
        LoggerService.error('authentication error');
        return res.status(401).send('authentication error');
    }

   
    //check if the order is creat 
    //and also if the idUser exist or match with the client in order 
    //because getById user idUser (erreur 400 for user is include)
    if(order === undefined){
        LoggerService.error('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
        return res.status(404).send('Order not found or access not allowed (user does not exist or do not match with idClient of the order)');
    }

    //check if a client don't finelized an order which does not belong to him
    if(user.role === UserRole.client ){
        if(userIdNumber !== order.client){
            LoggerService.error('access not allowed');
            return res.status(401).send('access not allowed');  
        }
    }

    //check if the order that a client want to finelized is NEW and change it to PROCESSING
    if(user.role === UserRole.client){
        if(order.status !== OrderStatus.NEW){
            if(newStatusBody.status !== OrderStatus.PROCESSING){
                LoggerService.error('access not allowed');
                return res.status(401).send('access not allowed');  
            }
        }
    }

    //check if the user is not DISABLED
    if(user !== undefined && user.status === "DISABLED"){
        LoggerService.error('Access denied');
        return res.status(401).send("Access denied");  
    }

    //check if the new status is one of those : NEW, PROCESSING, SHIPPED, DELIVERED and CANCELED
    const statusToCheck = OrdersService.checkStatus(newStatusBody.status);
    if(statusToCheck === false || statusToCheck === undefined){
        LoggerService.error('The status must be NEW, PROCESSING, SHIPPED, DELIVERED or CANCELED');
        return res.status(400).send('The status must be NEW, PROCESSING, SHIPPED, DELIVERED or CANCELED'); 
    }

    const updateOrder = OrdersService.updateStatusOrder(newStatusBody,orderId);
    if(!updateOrder){
        LoggerService.error('Order not update');
        return res.status(404).send('Order not update');  
    } 

    const updateUnitPrice = OrdersService.updateUnitPrice(orderId);
    if(updateUnitPrice !== true){
        LoggerService.error('The change of the price does not work');
        return res.status(404).send('The change of the price does not work');
    }
    return res.status(200).json();
});


