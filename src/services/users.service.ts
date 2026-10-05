import { NewUser, User, UserFilter, UserRole, UserStatus } from "../models/user.model";
import { DB } from "./db.service";
import { LoggerService } from "./logger.service";

export class UsersService{

    //This function returns all users
    static getAll(){

        let sqlQuery = 'SELECT * FROM users'; //Database command
        let sqlResponse;
        

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).all();
        } catch (error){
            LoggerService.error(error);
            throw new Error ('Internal Error');
        }

        const users: User[] = [];

        //creating a loop which will push every user from database to table users
        for(const d of sqlResponse){
            const u: User ={
                id: d.user_id,
                firstName: d.first_name,
                lastName: d.last_name,
                role: d.role,
                status: d.status  
            };
            users.push(u);
        }

        return users;
    }

    //This function returns a specific user, based by id
    static getById(userId: number): User | undefined {
        
        let sqlResponse;


        //Database command + looking for errors
        try{
            sqlResponse = DB.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        //if it didn't find the user
        if (!sqlResponse){
            return undefined;
        }

        //return the user if he was found
        return{
            id: sqlResponse.user_id,
            firstName: sqlResponse.first_name,
            lastName: sqlResponse.last_name,
            role: sqlResponse.role,
            status: sqlResponse.status
        };
    }

    //Insert a new user in the database
    static insert(user: NewUser): NewUser {
        let sqlResponse;
        const sqlQuery = 'INSERT INTO users (first_name, last_name) VALUES (?, ?)'; //database command
    
        //looking for errors
        try {
            sqlResponse = DB.prepare(sqlQuery).run(
                user.firstName,
                user.lastName
            );
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }
    
        return user;
    }

    //Update an user by id
    public static updateME(user: User): User | undefined {
        
        let sqlResponse;
        const sqlQueryClient = 'UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?'; //database command

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQueryClient).run(
                user.firstName, user.lastName, user.id
            );
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        //if it didn't change anything
        if(sqlResponse.changes === 0){
            return undefined;
        }

        return user;
    }

    public static update(user:User): User | undefined {

        let sqlResponse;
        const sqlQueryAdmin = 'UPDATE users SET first_name = ?, last_name = ?, role = ?, status = ? WHERE user_id = ?'; //database command

        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQueryAdmin).run(
                user.firstName, user.lastName, user.role ,user.status, user.id
            );
        } catch (error) {
            LoggerService.error(error);
            throw new Error('Internal Error');
        }

        //if it didn't change anything
        if(sqlResponse.changes === 0){
            return undefined;
        }

        return user;
    }


    //Delete a user from database by changing his ID to DISABLED
    public static delete(id : number): boolean{
        let sqlResponse
        const sqlQuery = "UPDATE users SET status = 'DISABLED' WHERE user_id = ?"; //database command
        
        //looking for errors
        try{
            sqlResponse = DB.prepare(sqlQuery).run(id);
        } catch (error){
            LoggerService.error(error);
            throw new Error('Internal Error');
        }
        //if it didn't change anything
        if(sqlResponse.changes === 0){
            return false;
        }
        return true;
    }
}


