import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";

const PlanController = () => {
    const create = async (req: IAuthRequest, res: Response) => {
        try {
            const {name, amount, active, price} = req.body;

            await prisma.plan.create({
                data: {
                    name,
                    amount,
                    active,
                    price
                }
            })

            return res.send('Plano criado com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const getAdmin = async (_: IAuthRequest, res: Response) => {
        try {
            const plans = await prisma.plan.findMany()

            return res.send({plans})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const get = async (_: IAuthRequest, res: Response) => {
        try {
            const plans = await prisma.plan.findMany({
                where: {
                    active: true
                },
                select: {
                    id: true,
                    name: true,
                    amount: true,
                    price: true,
                    createdAt: true
                }
            })

            return res.send({plans})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const update = async (req: IAuthRequest, res: Response) => {
        try {
            const body = req.body;

            await prisma.plan.update({
                where: {
                    id: body?.id
                },
                data: {
                    ...(body?.name && {name: body?.name}),
                    ...(body?.amount && {amount: body?.amount}),
                    ...(body?.active?.toString() && {active: body?.active?.toString() === "true"})
                }
            })

            return res.send('Plano atualizado com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const remove = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;

            await prisma.plan.delete({
                where: {
                    id
                }
            })

            return res.send('Plano deletado com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {create, get, update, remove, getAdmin}
}

export default PlanController();