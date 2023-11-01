import {Route} from "@/routes/types";
import Auth from "@/middlewares/auth";
import InfoController from "@/controllers/info";

export const route: Route[] = [
    {
        path: '/info/:id',
        method: 'get',
        middleware: [Auth as any],
        handler: InfoController.select
    },
    {
        path: '/info',
        method: 'get',
        middleware: [Auth as any],
        handler: InfoController.get
    },
    {
        path: '/info',
        method: 'delete',
        middleware: [Auth as any],
        handler: InfoController.remove
    },
]