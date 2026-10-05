import { OrderDTO } from "../models/order.model";
import { NewTicket, Ticket, TicketDTObasic } from "../models/ticket.model";
import { DB } from "./db.service";
import { LoggerService } from "./logger.service";


export class TicketsService{

    //This function will return all tickets of ALL users
    static getAll(){

        let sqlQuery = 'SELECT ticket_id, title, status FROM tickets'; //database command
        let sqlResponse;

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).all();
        }catch (error){
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        const tickets: TicketDTObasic[] = [];

        //loop to push every ticket to the table
        for(const d of sqlResponse){
            const t: TicketDTObasic ={
                ticketId: d.ticket_id,
                title: d.title,
                status: d.status
            };
            tickets.push(t);
        }

        return tickets;
    }

    //this function will return all of your tickets
    static getAllFromUser(userId: number): TicketDTObasic[] | undefined {
        
        //database command
        let sqlQuery = 'SELECT ti.ticket_id, ti.title, ti.status FROM tickets ti, orders WHERE ti.order_fk = orders.order_id AND orders.client = ?';
        let sqlResponse;

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).all(userId);
        }catch (error){
            LoggerService.error(error);
            throw new Error('Internal Error');
        }
        

        const tickets: TicketDTObasic[] = [];

        //loop to push every ticketDTO to table
        for(const d of sqlResponse){
            const t: TicketDTObasic ={
                ticketId: d.ticket_id,
                title: d.title,
                status: d.status
            };
            tickets.push(t);
        }

        return tickets;
    }

    static insert(ticket: NewTicket): NewTicket {

        let sqlResponse;
        const sqlQuery = 'INSERT INTO tickets (title, description, order_fk) VALUES (?,?,?)'; //database command

        //looking for errors
        try {
            sqlResponse = DB.prepare(sqlQuery).run(
                ticket.title,
                ticket.description,
                ticket.orderId
            );
        }catch (error) {
            LoggerService.error(error);
            LoggerService.error(`Ticket payload: ${JSON.stringify(ticket)}`);
            throw new Error('Internal Error');
        }

        return ticket;
    }

    //This function returns a specific ticket with basic information, based by id
    static getById(order_fk: number): TicketDTObasic | undefined {

        const sqlQuery = 'SELECT ticket_id, title, status FROM tickets WHERE ticket_id = ?'; //database command
        let sqlResponse;

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).get(order_fk);
        }catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        //if not found
        if(!sqlResponse){
            return undefined;
        }

        return{
            ticketId: sqlResponse.ticket_id,
            title: sqlResponse.title,
            status: sqlResponse.status
        };
    }

    //This function returns a specific ticket with full information, based by id
    static getByIdFull(order_fk: number): Ticket | undefined {

        const sqlQuery = 'SELECT * FROM tickets WHERE ticket_id = ?'; //database command
        let sqlResponse;

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).get(order_fk);
        }catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        //if not found
        if(!sqlResponse){
            return undefined;
        }

        return{
            ticketId: sqlResponse.ticket_id,
            title: sqlResponse.title,
            description: sqlResponse.description,
            orderFK: sqlResponse.order_fk,
            status: sqlResponse.status
        };
    }   

    public static update(status: string, id:number){

        let sqlResponse;
        const sqlQuery = 'UPDATE tickets SET status = ? WHERE ticket_id = ?'; //database command

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).run(
                status,
                id
            );
        }catch (error){
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        //if it didn't change anything
        if(sqlResponse.changes ===0){
            return undefined;
        }

        return TicketsService.getById(id);
    }
}