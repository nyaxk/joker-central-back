import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";

const ErrorsController = () => {
    const get = async (_: IAuthRequest, res: Response) => {
        try {
            const errors = await prisma.errors.findMany()

            return res.send({errors})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const remove = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;

            await prisma.errors.delete({
                where: {
                    id
                }
            })

            return res.send('Error deletado com sucesso !')
        }  catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {get, remove}
}

export default ErrorsController();