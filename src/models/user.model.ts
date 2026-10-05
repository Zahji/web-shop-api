export enum UserStatus{
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED'
}

export enum UserRole{
    client = 'client',
    admin = 'admin'
}


export interface User {
    id : number;
    firstName : string;
    lastName: string;
    role : string;
    status : string;
}

export interface NewUser{
    firstName : string;
    lastName : string;
}

export interface UserFilter{
    idUser?: number;
}