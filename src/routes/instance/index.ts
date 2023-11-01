import {Route} from "@/routes/types";
import Auth from "@/middlewares/auth";
import InstanceController from "@/controllers/instance";
import OnlyOwner from "@/middlewares/only-owner";
import expressValidator from "express-joi-validation";
import {CreateInstanceSchema} from "@/validator/instance";
const Validator = expressValidator.createValidator({});

export const route: Route[] = [
    {
        path: '/instance',
        method: 'post',
        middleware: [Auth as any, Validator.body(CreateInstanceSchema)],
        handler: InstanceController.create
    },
    {
        path: '/instance/resume',
        method: 'post',
        middleware: [Auth as any, Validator.body(CreateInstanceSchema)],
        handler: InstanceController.resume
    },
    {
        path: '/instance',
        method: 'get',
        middleware: [Auth as any],
        handler: InstanceController.get
    },
    {
        path: '/instance/:id',
        method: 'get',
        middleware: [Auth as any],
        handler: InstanceController.select
    },
    {
        path: '/admin/instance',
        method: 'get',
        middleware: [Auth as any, OnlyOwner as any],
        handler: InstanceController.get
    },
    {
        path: '/instance/:id',
        method: 'delete',
        middleware: [Auth as any],
        handler: InstanceController.remove
    },
]