import { Document } from "mongoose";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    image: string;
}

export interface IuserMethods {
    matchPassword(enteredPassword: string): Promise<boolean>; //this method will return a boolean
}

export type UserDocument = Document & IUser & IuserMethods; //UserDocument is a combination of IUser and Document