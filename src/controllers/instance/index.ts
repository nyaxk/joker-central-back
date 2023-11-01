import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";
import {InfoStatus, InstanceStatus} from "@prisma/client";
import {InstanceQueue} from "@/index";

const InstanceController = () => {
    const create = async (req: IAuthRequest, res: Response) => {
        try {
            const {cc, gate} = req.body;
            const user = req?.user;

            const gateway = await prisma.gateway.findFirst({
                where: {
                    id: gate
                }
            })

            if (!gateway) {
                return res.status(404).send('Gate not found !')
            }

            const instance = await prisma.instance.create({
                data: {
                    status: InstanceStatus.WAITING,
                    dies: 0,
                    lives: 0,
                    progress: 0,
                    userId: user?.id,
                    gatewayId: gate
                }
            })

            let ccs = [];

            for await (const info of cc) {
                ccs.push(await prisma.info.create({
                    data: {
                        cc: info,
                        status: InfoStatus.TESTING,
                        instanceId: instance?.id
                    }
                }))
            }

            const job = InstanceQueue.createJob({instance: instance.id})
            await job.save();

            return res.send('Instância criada com sucesso !');
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const get = async (req: IAuthRequest, res: Response) => {
        try {
            const user = req?.user;
            const instances = await prisma.instance.findMany({
                where: {
                    userId: user?.id
                },
                select: {
                    id: true,
                    status: true,
                    lives: true,
                    dies: true,
                    progress: true,
                    statusMessage: true,
                    gateway: {
                        select: {
                            id: true,
                            status: true,
                            name: true
                        }
                    },
                    createdAt: true,
                },
                orderBy: {
                    status: 'desc'
                }
            })
            return res.send({instances})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const getAdmin = async (_: IAuthRequest, res: Response) => {
        try {
            const instances = await prisma.instance.findMany();
            return res.send({instances})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const select = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;
            const user = req.user;

            const instance = await prisma.instance.findUnique({
                where: {
                    id: id ?? '',
                    userId: user?.id
                },
                select: {
                    id: true,
                    status: true,
                    statusMessage: true,
                    lives: true,
                    dies: true,
                    progress: true,
                    infos: {
                        select: {
                            cc: true,
                            status: true
                        }
                    },
                    createdAt: true,
                }
            })

            if (!instance) {
                return res.status(404).send('Instância não encontrada !');
            }

            return res.send({instance})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const resume = async (req: IAuthRequest, res: Response) => {
        try {
            const {instanceId} = req.body;

            await prisma.instance.update({
                where: {
                    id: instanceId
                }, data: {
                    status: InstanceStatus.PROGRESS,
                    statusMessage: null
                }
            })

            const job = InstanceQueue.createJob({instance: instanceId})
            await job.save();

            return res.send()
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const remove = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;
            const user = req.user;

            await prisma.instance.delete({
                where: {
                    id,
                    userId: user?.id
                }
            })

            return res.send('Instância deletada com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {get, create, getAdmin, select, resume, remove};
}

export default InstanceController()