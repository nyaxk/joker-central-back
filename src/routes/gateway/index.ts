import {Route} from "@/routes/types";
import Auth from "@/middlewares/auth";
import GatewayController from "@/controllers/gateway";
import OnlyOwner from "@/middlewares/only-owner";

export const route: Route[] = [
    {
        path: '/gateway',
        method: 'get',
        middleware: [Auth as any],
        handler: GatewayController.get
    },
    {
        path: '/admin/gateway',
        method: 'post',
        middleware: [Auth as any, OnlyOwner as any],
        handler: GatewayController.create
    },
    {
        path: '/admin/gateway',
        method: 'get',
        middleware: [Auth as any, OnlyOwner as any],
        handler: GatewayController.getAdmin
    },
    {
        path: '/admin/gateway',
        method: 'put',
        middleware: [Auth as any, OnlyOwner as any],
        handler: GatewayController.edit
    },
    {
        path: '/admin/gateway/:id',
        method: 'delete',
        middleware: [Auth as any, OnlyOwner as any],
        handler: GatewayController.remove
    },
]