import {IAuthRequest} from "@/routes/types";
import {NextFunction, Response} from "express";
import {UserRole} from "@prisma/client";

export default async function OnlyOwner(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
        const user = req?.user;
        const role = user?.role;

        if(role !== UserRole.OWNER){
            return res.status(401).send('Unauthorized')
        }

        return next();
    } catch (e) {
        return res.status(400).send('Unauthorized')
    }
}