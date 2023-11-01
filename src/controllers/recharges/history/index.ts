import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";

const RechargesHistoryController = () => {
    const get = async (req: IAuthRequest, res: Response) => {
        try {
            const user = req?.user;

            const recharges = await prisma.rechargeHistory.findMany({
                where: {
                    userId: user?.id
                },
                select: {
                    id: true,
                    method: true,
                    plan: {
                        select: {
                            name: true,
                            amount: true
                        }
                    },
                    createdAt: true
                }
            })

            return res.send({recharges})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const create = async (req: IAuthRequest, res: Response) => {
        try {
            const {method, transactionId, planId, userId} = req.body;

            await prisma.rechargeHistory.create({
                data: {
                    method,
                    transactionId,
                    planId,
                    userId
                }
            })

            return res.send('Recarga criada com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {get, create}
}

export default RechargesHistoryController();