
export enum TicketStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    IN_PROGRESS = 'IN_PROGRESS'
}

export interface Ticket {
    ticketId : number;
    orderFK : number;
    title : string;
    description : string;
    status : string;
}

export interface NewTicket {
    title : string;
    description : string;
    orderId: number;
}

export interface TicketDTObasic{
    ticketId : number;
    title: string;
    status : string;
}