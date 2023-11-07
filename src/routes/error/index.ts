import {Route} from "@/routes/types";
import ErrorsController from "@/controllers/errors";
import Auth from "@/middlewares/auth";
import OnlyOwner from "@/middlewares/only-owner";

export const route: Route[] = [
    {
        path: '/admin/errors',
        method: 'get',
        middleware: [Auth as any, OnlyOwner as any],
        handler: ErrorsController.get
    },
    {
        path: '/admin/errors/:id',
        method: 'delete',
        middleware: [Auth as any, OnlyOwner as any],
        handler: ErrorsController.remove
    },
]