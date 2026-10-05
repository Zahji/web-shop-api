import { Router, Request, Response } from "express";
import { NewUser, User, UserFilter, UserRole, UserStatus } from "../models/user.model";
import { isUser, isNumber, isString, isNewUser, isPositiveInteger, isIdentifier } from "../utils/guards";
import { UsersService } from "../services/users.service";
import { LoggerService } from "../services/logger.service";
import { stat } from "fs";

export const userController = Router();

//This function will returns all users

userController.get('/', (req: Request, res: Response) => {
    LoggerService.info('[GET] /users/');

    const idString = req.query.idUser; //looking who wants to do this

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){ 
        const idUser = parseInt(idString);
        if(isIdentifier(idUser)){
            const checkUser : User | undefined = UsersService.getById(idUser);
            //if the id user isn't an admin or isn't enabled then error
            if(checkUser?.role != UserRole.admin || checkUser?.status != UserStatus.ENABLED){
                LoggerService.error("You don't have permission to do this");
                res.status(400).send("You don't have permission to do this");
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
    
    const result: User[] = UsersService.getAll();
    res.status(200).json(result);
    return;
});

//GET user by :id
userController.get('/:id', (req: Request, res: Response) => {
    LoggerService.info("[GET] /users/:id");

    const id = parseInt(req.params.id); //taking the body id and making it a number

    //seeing if it's id
    if(!isIdentifier(id)){
        LoggerService.error("Invalid id");
        res.status(400).send("Invalid id");
        return;
    }
    
    const idString = req.query.idUser; //looking who wants to do this

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
        const idUser = parseInt(idString);
        if(isIdentifier(idUser)){
            const checkUser : User | undefined = UsersService.getById(idUser);
            //if the id user isn't an admin or isn't enabled then error
            if(checkUser?.role != UserRole.admin || checkUser?.status != UserStatus.ENABLED){
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


    const user : User | undefined = UsersService.getById(id);

    //if user doesn't exist
    if(user === undefined){
        LoggerService.error('User not found');
        res.status(404).send('User not found');
        return;
    }

    res.status(200).json(user);
    return;
});


//POST an user
userController.post('/', (req: Request, res: Response) => {
    LoggerService.info('[POST] /users/');

    const body = req.body; //taking body

    //variable for a new user
    const nUser = {
        firstName: body.firstName,
        lastName: body.lastName
    };

    //if he isn't a new user
    if (!isNewUser(nUser)) {
        LoggerService.error('Bad request: failed isNewUser check');
        return res.status(400).send('Bad request');
    }

    const newUser: NewUser = UsersService.insert(nUser);
    return res.status(200).json(newUser);
});

//PUT, Update user
userController.put('/',(req : Request, res: Response) => {
    LoggerService.info('[PUT] /users/');
    
    const idString = req.query.idUser; //looking who wants to do this
    const tmpUser:User | any = req.body //taking a body that can be either user or any
    const role = 'role' in tmpUser; //if role is in user then true
    const status = 'status' in tmpUser; //if status is in user then true

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
        const id = parseInt(idString);
        if(isIdentifier(id)){
            //checking if the user that we want to update exist
            const userID: User | undefined = UsersService.getById(parseInt(tmpUser.id));
            if(userID != undefined){
                //checking if the person that want to update is enabled
                if(UsersService.getById(id)?.status == UserStatus.ENABLED) {
                    //checking if he is an admin
                    if(UsersService.getById(id)?.role == UserRole.admin){
                        // checking if tmp user is a user
                        if(isUser(tmpUser)){
                            const update = UsersService.update(tmpUser);
                            return res.status(200).json(update);
                        }
                        //if not then checking if he has role and status
                        else if(!isUser(tmpUser) && !role && !status &&  tmpUser.id && tmpUser.firstName && tmpUser.lastName){
                            const update = UsersService.updateME(tmpUser);
                            return res.status(200).json(update);
                        }
                        LoggerService.error("Invalid body");
                        return res.status(400).send("Invalid body");
                    }
                    else if(UsersService.getById(id)?.role == UserRole.client){
                        //if the person updating isn't an admin but a client and they have the same id
                        if(id == parseInt(tmpUser.id)){
                            //if it's only first and last name that they want to change then okay
                            if(!isUser(tmpUser) && !role && !status &&  tmpUser.id && (tmpUser.firstName || tmpUser.lastName)){
                                const update = UsersService.updateME(tmpUser);
                                return res.status(200).json(update);
                            }
                            LoggerService.error("You don't have permission to do that");
                            return res.status(400).send("You don't have permission to do that");
                        }
                        LoggerService.error("You don't have permission to do that");
                        return res.status(401).send("You don't have permission to do that");
                    }
                    LoggerService.error("Invalid body");
                    return res.status(400).send("Invalid body");
                }
                LoggerService.error("You don't have permission to do that");
                return res.status(401).send("You don't have permission to do that");
            }
            LoggerService.error("Couldn't find the user");
            return res.status(404).send("Couldn't find the user");
        }
        LoggerService.error("You don't have permission to do that");
        return res.status(401).send("You don't have permission to do that");
    }
    LoggerService.error("You don't have permission to do that");
    return res.status(401).send("You don't have permission to do that");
})


//DELETE a user, by setting his status to Disabled
userController.delete('/:id', (req : Request, res : Response)=>{
    LoggerService.info('[DELETE] /users/:id')

    const id = parseInt(req.params.id); //loking who to delete

    //checking if it's an id
    if(!isIdentifier(id)){
        LoggerService.error("Invalid id");
        res.status(400).send("Invalid id");
        return;
    }
    
    const idString = req.query.idUser; //looking who wants to do this

    //seeing if id in url is string and if it is then change it to int and check
    if(isString(idString)){
        const idUser = parseInt(idString);
        if(isIdentifier(idUser)){
            const checkUser : User | undefined = UsersService.getById(idUser);
            //if he isn't an admin then
            if(checkUser?.role != UserRole.admin){
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


    const user : User | undefined = UsersService.getById(id);

    //if user that you want ot delete doesn't exist
    if(user === undefined){
        LoggerService.error('User not found');
        res.status(404).send('User not found');
        return;
    }

    const userDeleted = UsersService.delete(id)
    res.status(200).json(userDeleted);
    return;
})

