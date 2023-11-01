import {Route} from "@/routes/types";
import RechargesHistoryController from "@/controllers/recharges/history";
import Auth from "@/middlewares/auth";
import OnlyAdmin from "@/middlewares/role";

export const route: Route[] = [
    {
        path: '/recharges/history',
        method: 'get',
        middleware: [Auth as any],
        handler: RechargesHistoryController.get
    },
    {
        path: '/admin/recharges/history',
        method: 'post',
        middleware: [Auth as any, OnlyAdmin as any],
        handler: RechargesHistoryController.create
    },
]