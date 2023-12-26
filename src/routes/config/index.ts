import {Route} from "@/routes/types";
import ConfigController from "@/controllers/config";
import OnlyOwner from "@/middlewares/only-owner";
import Auth from "@/middlewares/auth";

export const route: Route[] = [
    {
        path: '/maintenance',
        method: 'get',
        middleware: [],
        handler: ConfigController.maintenance
    },
    {
        path: '/config',
        method: 'get',
        middleware: [Auth as any,OnlyOwner as any],
        handler: ConfigController.get
    },
    {
        path: '/config',
        method: 'put',
        middleware: [Auth as any,OnlyOwner as any],
        handler: ConfigController.edit
    },
]
