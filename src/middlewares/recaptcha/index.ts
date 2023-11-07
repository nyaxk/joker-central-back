import {NextFunction, Request, Response} from "express";
import axios from "axios";
import * as process from "process";


export const RecaptchaMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // if (process.env.NODE_ENV === 'development') {
        //     return next();
        // }

        const {recaptchaToken} = req.body;

        const {data} = await axios.get('https://www.google.com/recaptcha/api/siteverify', {
            params: {
                secret: process.env.RECAPTCHA_SECRET,
                response: recaptchaToken
            }
        })

        if (!data?.success) {
            return res.status(400).send('Invalid recaptcha')
        }


        return next()
    } catch (e: any) {
        return res.status(404).send(e?.message)
    }
}