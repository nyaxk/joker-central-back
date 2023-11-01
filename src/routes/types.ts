import {Request, Response, RequestHandler as Middleware} from "express";
import {User} from "@prisma/client";

type Method =
    | 'get'
    | 'post'
    | 'patch'
    | 'put'
    | 'delete'
    | 'options';

export interface IAuthRequest extends Request {
    user: User;
}

export type Handler = (req: IAuthRequest, res: Response) => any

export type Route = {
    method: Method
    path: string
    middleware: Middleware[]
    handler: Handler
}

