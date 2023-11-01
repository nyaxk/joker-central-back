import {NextFunction, Response} from "express";
import {IAuthRequest} from "@/routes/types";
import JWT from 'jsonwebtoken';
import * as process from "process";
import {prisma} from "@/globals";

export default async function Auth(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
        const Bearer: string = req.headers?.authorization?.split('Bearer ')[1] ?? ''
        const SECRET: string = process.env.SECRET || 'SECRET';
        const verify: JWT.JwtPayload = await JWT.verify(Bearer, SECRET) as JWT.JwtPayload

        const user = await prisma.user.findFirst({
            where: {
                id: verify?.iss,
                token: Bearer
            }
        })

        if (!user) {
            return res.status(401).send('Unauthorized')
        }

        if (!user?.active) {
            return res.status(401).send('Unauthorized')
        }

        req.user = user;

        return next()
    } catch (e) {
        return res.status(400).send('Unauthorized')
    }
}