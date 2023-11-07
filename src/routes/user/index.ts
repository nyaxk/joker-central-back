import {Route} from "@/routes/types";
import UserController from "@/controllers/user";
import {LoginUserSchema, RegisterUserSchema, UpdateUserSchema} from "@/validator/user";
import expressValidator from 'express-joi-validation';
import Auth from "@/middlewares/auth";
import OnlyAdmin from "@/middlewares/role";
import {RecaptchaMiddleware} from "@/middlewares/recaptcha";
const Validator = expressValidator.createValidator({});

export const route: Route[] = [
    {
        path: '/user/register',
        method: 'post',
        middleware: [
            Validator.body(RegisterUserSchema)
        ],
        handler: UserController.register
    },
    {
        path: '/user/login',
        method: 'post',
        middleware: [
            Validator.body(LoginUserSchema),
            RecaptchaMiddleware
        ],
        handler: UserController.login
    },
    {
        path: '/admin/user',
        method: 'put',
        middleware: [Auth as any, OnlyAdmin as any, Validator.body(UpdateUserSchema)],
        handler: UserController.update
    },
    {
        path: '/admin/user/create',
        method: 'post',
        middleware: [Auth as any, OnlyAdmin as any],
        handler: UserController.create
    },
    {
        path: '/user/me',
        method: 'get',
        middleware: [Auth as any],
        handler: UserController.me
    },
    {
        path: '/admin/user/:id',
        method: 'delete',
        middleware: [Auth as any, OnlyAdmin as any],
        handler: UserController.remove
    },
    {
        path: '/admin/user',
        method: 'get',
        middleware: [Auth as any, OnlyAdmin as any],
        handler: UserController.get
    },
]