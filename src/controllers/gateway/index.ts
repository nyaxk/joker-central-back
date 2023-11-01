import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";
import {GatewayStatus} from "@prisma/client";


const GatewayController = () => {
    const get = async (_: IAuthRequest, res: Response) => {
        try {
            const gates = await prisma.gateway.findMany({
                where: {
                    status: GatewayStatus.ACTIVE
                },
                select: {
                    id: true,
                    status: true,
                    name: true
                }
            })

            return res.send({gates})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }
    const getAdmin = async (_: IAuthRequest, res: Response) => {
        try {
            const gates = await prisma.gateway.findMany()

            return res.send({gates})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }
    const create = async (req: IAuthRequest, res: Response) => {
        try {
            const {name, apiUrl, expectedResponse, active} = req.body;

            await prisma.gateway.create({
                data: {
                    name,
                    apiUrl,
                    expectedResponse,
                    status: active === "true" ? GatewayStatus.ACTIVE : GatewayStatus.DISABLED
                }
            })

            return res.send("Gateway criado com sucesso !");
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const edit = async (req: IAuthRequest, res: Response) => {
        try {
            const body = req.body;

            await prisma.gateway.update({
                where: {
                    id: body?.id
                },
                data: {
                    ...(body?.name && {name: body?.name}),
                    ...(body?.status && {status: body?.status}),
                    ...(body?.apiUrl && {apiUrl: body?.apiUrl}),
                    ...(body?.expectedResponse && {expectedResponse: body?.expectedResponse}),
                }
            })

            return res.send('Gateway editada com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const remove = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;
            await prisma.gateway.delete({
                where: {
                    id
                }
            })

            return res.send('Gateway deletada com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {create, get, getAdmin, edit, remove}
}

export default GatewayController();