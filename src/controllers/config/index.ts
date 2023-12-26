import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";

const ConfigController = () => {
    const get = async (_: IAuthRequest, res: Response) => {
        try {
            const configs = await prisma.config.findMany()

            return res.send({configs})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const select = async (req: IAuthRequest, res: Response) => {
        try {
            const {config} = req.params;

            const selectedConfig = await prisma.config.findFirst({
                where: {
                    name: config
                }
            })

            if (!selectedConfig) {
                return res.status(404).send("Config não encontrada")
            }

            return res.send({config: selectedConfig})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const maintenance = async (_: IAuthRequest, res: Response) => {
        try {
            const selectedConfig = await prisma.config.findFirst({
                where: {
                    name: 'maintenance'
                }
            })

            if (!selectedConfig) {
                return res.status(404).send("Config não encontrada")
            }

            return res.send({config: selectedConfig})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const edit = async (req: IAuthRequest, res: Response) => {
        try {
            const {maintenance} = req.body;

            await prisma.config.updateMany({
                where: {
                    name: 'maintenance'
                },
                data: {
                    value: maintenance?.toString()
                }
            })

            return res.send({message: 'Config editada com sucesso !'})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {get, select, maintenance, edit}
}

export default ConfigController()
