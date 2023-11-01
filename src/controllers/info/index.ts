import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";
import {InfoStatus} from "@prisma/client";

const InfoController = () => {
    const get = async (req: IAuthRequest, res: Response) => {
        try {
            const instanceId = <string>req.query.instanceId;

            const info = await prisma.info.findMany({
                where: {
                    instanceId: instanceId,
                    AND: [
                        {
                            OR: [
                                {status: InfoStatus.LIVE},
                                {status: InfoStatus.DIE},
                            ]
                        }
                    ]
                },
                select: {
                    cc: true,
                    status: true
                }
            })


            return res.send({info})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }
    const select = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;

            const info = await prisma.info.findUnique({
                where: {
                    id
                },
                select: {
                    cc: true,
                    status: true
                }
            })

            if (!info) {
                return res.status(404).send("Info not found");
            }

            return res.send({info})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const remove = async (req: IAuthRequest, res: Response) => {
        try {
            const instanceId = <string>req.query.instanceId;

            await prisma.info.deleteMany({
                where: {
                    instanceId,
                    status: InfoStatus.DIE
                },
            })

            return res.send("Deletado todas infos die")
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {select, get, remove}
}

export default InfoController();