import {Route} from "@/routes/types";
import Auth from "@/middlewares/auth";
import RakingController from "@/controllers/ranking";

export const route: Route[] = [
    {
        path: '/ranking',
        method: 'get',
        middleware: [Auth as any],
        handler: RakingController.get
    }
]