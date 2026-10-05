// import dependencies
const cors = require('cors');
import express from "express";
import { Response, Request } from 'express';
import { ordersController } from "./controllers/orders.Controller";
import { productsController } from "./controllers/products.controller";
import { categoriesController } from "./controllers/categories.controller";
import { userController } from "./controllers/users.controller";
import { ticketController } from "./controllers/tickets.controller";


// creates an express app
export const app = express();
app.use(cors());
app.use(express.json());

// defines a dummy route
app.get('/', (req: Request, res: Response) => {
    res.send("Bonjour tout le monde ");
  });
  

//use the controller of orders to use the route
app.use('/orders', ordersController); 
app.use("/products", productsController);
app.use("/categories", categoriesController);
app.use("/users", userController);
app.use("/tickets", ticketController);