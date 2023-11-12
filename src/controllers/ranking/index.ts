import {IAuthRequest} from "@/routes/types";
import {Response} from "express";
import {prisma} from "@/globals";

const RankingController = () => {

    const get = async (_: IAuthRequest, res: Response) => {
        try {
            const ranking = await prisma.user.findMany({
                select: {
                    lives: true,
                    createdAt: true,
                    username: true
                },
                orderBy: {
                    lives: 'asc'
                },
                take: 3
            })

            return res.send({ranking: ranking?.sort((a: any, b: any) => parseInt(b?.lives) - parseInt(a?.lives))})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }
    return {get}
}

export default RankingController()