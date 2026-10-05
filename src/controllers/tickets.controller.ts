import { Router, Request, Response } from "express";
import { NewTicket, Ticket, TicketDTObasic, TicketStatus } from "../models/ticket.model";
import { isIdentifier, isNewTicket, isNumber, isString, isTicket } from "../utils/guards";
import { TicketsService } from "../services/tickets.service";
import { LoggerService } from "../services/logger.service";
import { UsersService } from "../services/users.service";
import { User, UserFilter, UserRole, UserStatus } from "../models/user.model";
import { OrdersService } from "../services/orders.service";

export const ticketController = Router();

//This function will returns all tickets for all users OR only yours

ticketController.get("/", (req: Request, res: Response) => {
    LoggerService.info('[GET] /tickets/');

    const idStringUser = req.query.idUser; //looking who wants to do this

    const includeUsers = req.query.includeAllUsers; //looking if it should include all users


    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idStringUser) && isString(includeUsers)){
        const idUser = parseInt(idStringUser);

        
        if(isIdentifier(idUser)){
            const checkUser: User | undefined = UsersService.getById(idUser);
            if(checkUser != undefined){
                
                //if include all and you are an admin
                if(includeUsers == 'true' && checkUser?.role == UserRole.admin){
                
                    const result: TicketDTObasic[] = TicketsService.getAll();
                    res.status(200).json(result);
                    return;
                }

                //just yours ticket
                if(includeUsers == 'false'){

                    const result: TicketDTObasic[] | undefined = TicketsService.getAllFromUser(idUser);
                    res.status(200).json(result);
                    return;
                }

                LoggerService.error("You don't have an authorisation to do that");
                res.status(401).send("You don't have an authorisation to do that");
                return;
            }
            
            LoggerService.error("Couldn't find the id");
            res.status(404).send("Couldn't find the id");
            return;

        }
        LoggerService.error("Bad request");
        res.status(400).send("Bad request");
        return;
    }
    LoggerService.error("Bad request");
    res.status(400).send("Bad request");
    return;
})

//POST a ticket
ticketController.post('/', (req: Request, res: Response) => {
    LoggerService.info('[POST] /tickets/');

    const idString = req.query.idUser; //loking who want to do this
    const body = req.body; //taking body

    //new ticket
    const nTicket = {
        title: body.title,
        description: body.description,
        orderId: parseInt(body.orderId)
    };

    //SHOW values of the new ticket
    console.log('New ticket:', nTicket);

    //if it isn't new ticket
    if(!isNewTicket(nTicket)){
        LoggerService.error('Bad request: failed isNewTicket check');
        return res.status(400).send('Bad request');
    }

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
        const idUser = parseInt(idString);
        const checkUser : User | undefined = UsersService.getById(idUser);

        const idUSE : UserFilter = {};
        idUSE.idUser = checkUser?.id;

        //if everything is right then
        if(OrdersService.getById(nTicket.orderId, idUSE)?.client == checkUser?.id && checkUser?.status == UserStatus.ENABLED){
            console.log(OrdersService.getById(nTicket.orderId, idUSE));
            const newTicket: NewTicket = TicketsService.insert(nTicket);
            return res.status(200).json(newTicket);
        }

        LoggerService.error("You don't have an authorisation to do that");
        res.status(401).send("You don't have an authorisation to do that");
        return;
        
    }
    LoggerService.error("Bad request");
    res.status(400).send("Bad request");
    return;

})

//GET the basic information of a ticket by :ticketId
ticketController.get('/:id', (req: Request, res: Response) => {
    LoggerService.info('[GET] /tickets/:id');

    const id = parseInt(req.params.id); //what users you want to look up

    //checking if it's a proper id
    if(!isIdentifier(id)){
        LoggerService.error("Invalid id");
        res.status(400).send("Invalid id");
        return;
    }

    const ticket : TicketDTObasic | undefined = TicketsService.getById(id);
    //even if we want to show only DTO information we need to get full ticket bcs DTO don't have order_fk
    const tmp: Ticket | undefined = TicketsService.getByIdFull(id); 

    //if ticket doesn't exist
    if(ticket === undefined || tmp === undefined){
        LoggerService.error('Ticket not found');
        res.status(404).send('Ticket not found');
        return;
    }
    

    const idString = req.query.idUser; //looking who wants to do this

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
        const idUser = parseInt(idString);
        if(isIdentifier(idUser)){
            const checkUser : User | undefined = UsersService.getById(idUser);

            const idUSE : UserFilter = {};
            idUSE.idUser = checkUser?.id;

            //if you are not an admin or it's not your ticket then
            if(checkUser?.role != UserRole.admin || !(OrdersService.getById(tmp.orderFK, idUSE)?.client == checkUser?.id)){
                LoggerService.error("You don't have permission to do this");
                res.status(401).send("You don't have permission to do this");
                return;
            }
        }
        else{
            LoggerService.error("Bad request");
            res.status(400).send("Bad request");
            return;}
    }
    else{
        LoggerService.error("Bad request");
        return res.status(400).send("Bad request");
    }

    return res.status(200).json(ticket);

});

//GET the full information of a ticket by :ticketId
ticketController.get('/:id/full', (req: Request, res: Response) => {
    LoggerService.info('[GET] /tickets/:id/full');

    const id = parseInt(req.params.id); //looking who wanto to do this

    //checking if it's proper id
    if(!isIdentifier(id)){
        LoggerService.error("Invalid id");
        res.status(400).send("Invalid id");
        return;
    }

    const tmp: Ticket | undefined = TicketsService.getByIdFull(id);

    //if ticket not found
    if(tmp === undefined){
        LoggerService.error('Ticket not found');
        res.status(404).send('Ticket not found');
        return;
    }
    

    const idString = req.query.idUser;

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
        const idUser = parseInt(idString);
        if(isIdentifier(idUser)){
            const checkUser : User | undefined = UsersService.getById(idUser);

            const idUSE : UserFilter = {};
            idUSE.idUser = checkUser?.id;
            
            //if you are not and admin or it's not your ticket then
            if(checkUser?.role != UserRole.admin || !(OrdersService.getById(tmp.orderFK, idUSE)?.client == checkUser?.id)){
                LoggerService.error("You don't have permission to do this");
                res.status(401).send("You don't have permission to do this");
                return;
            }
        }
        else{
            LoggerService.error("Bad request");
            res.status(400).send("Bad request");
            return;}
    }
    else{
        LoggerService.error("Bad request");
                res.status(400).send("Bad request");
                return;
    }

    res.status(200).json(tmp);
    return;

});

ticketController.put('/:id/status', (req: Request, res: Response) => {
    LoggerService.info('[PUT] /tickets/:id/status');

    const ticket = req.body.status; //taking status
    const idTicket = parseInt(req.params.id); //taking id ticket
    const idString = req.query.idUser; //looking who wants to do it


    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
            const id = parseInt(idString);
            if(isIdentifier(id)){
                //if you are and amind and status is good then
                if(UsersService.getById(id)?.role == UserRole.admin){
                    if((ticket == TicketStatus.CLOSED || ticket == TicketStatus.IN_PROGRESS || ticket == TicketStatus.OPEN) && TicketsService.getById(idTicket) != undefined && TicketsService.getById(idTicket)?.status != TicketStatus.CLOSED ){
                        const result = TicketsService.update(ticket,idTicket);
                        return res.status(200).json(result);
                    }
                    LoggerService.error("You don't have permission to do this");
                    res.status(401).send("You don't have permission to do this");
                    return;
                }
                LoggerService.error("You don't have permission to do this");
                res.status(401).send("You don't have permission to do this");
                return;
            }
            LoggerService.error("Bad request");
            res.status(400).send("Bad request");
            return;
    }
    LoggerService.error("Bad request");
    res.status(400).send("Bad request");
    return;
})