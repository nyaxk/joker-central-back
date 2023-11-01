import express, {Request, Response} from 'express'
import {routes} from './routes'
import cors from 'cors';
import * as path from "path";
import Queue from 'bee-queue';
import * as redis from 'redis';
import {Server} from "socket.io";
import {prisma} from "@/globals";
import {InfoStatus, InstanceStatus} from "@prisma/client";
import axios from "axios";

const app = express();

export const InstanceQueue = new Queue('consumer-instance', {
    redis: redis.createClient({url: process.env.REDIS_URL ?? ''}),
});

const PORT: number = parseInt(process.env.PORT ?? '') || 4000;

app.use(express.json())
app.use(cors())
app.use('/static', express.static('public'))

app.use(express.json())

const router = express.Router();

routes.forEach((route) => {
    const {method, path, middleware, handler} = route;
    router[method](path, ...middleware, handler as any)
})

if (process.env.NODE_ENV === 'production') {
    router.use(express.static(path.join(__dirname, './build')))
    router.get('*', (_: Request, res: Response) => {
        res.sendFile(path.join(__dirname, './build', 'index.html'))
    })
}

router.get('/test', async (_, res) => {
    await new Promise(r => setTimeout(r, 5000));
    return res.send("#LIVE")
})

router.get('/socket-test', (_, res) => {
    io.emit('419a5e59-a6f1-4987-9ccb-666e1b90bf0a', {
        lives: 10,
        dies: 10,
        progress: 20
    })
    return res.send("OK")
})

app.use('/api', router)

const server = app.listen(PORT, () => {
    console.log("[+] Servidor iniciado na porta:", PORT)
})

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log(`[+] User connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[-] User disconnected: ${socket.id}`);
    });
});

InstanceQueue.process(10000, async function (job: any, done: any) {
    const instanceId = job.data.instance;
    try {
        console.log(`[Executando instância] - ${job.data.instance}`);
        const instanceData = await prisma.instance.findUnique({
            where: {
                id: instanceId,
            },
            include: {
                infos: {
                    where: {
                        status: InfoStatus.TESTING
                    }
                },
                gateway: true,
                user: true
            }
        })

        const infos = instanceData?.infos;

        await prisma.instance.update({
            where: {
                id: instanceId
            },
            data: {
                status: InstanceStatus.PROGRESS
            }
        })

        const counts = await prisma.info.groupBy({
            by: ['status'],
            where: {
                instanceId
            },
            _count: {
                status: true
            }
        })

        let lives = counts?.find((count) => count.status === 'LIVE')?._count?.status ?? 0;
        let dies = counts?.find((count) => count.status === 'DIE')?._count?.status ?? 0;
        let total = 0;

        for await (const info of infos ?? []) {
            const instance = await prisma.instance.findUnique({
                where: {
                    id: instanceId
                }
            })

            if (instance?.status === InstanceStatus.PAUSED || instance?.status === InstanceStatus.CANCELLED) {
                return done(null, instance?.status)
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: instanceData?.user?.id
                }
            })

            const credits = (user?.credits?.toNumber() ?? 0) - 1;

            if (credits < 0) {
                await prisma.instance.update({
                    where: {
                        id: instanceData?.id
                    },
                    data: {
                        status: InstanceStatus.PAUSED,
                        statusMessage: 'Saldo insuficiente !'
                    }
                })

                io.emit(instanceId, {
                    lives,
                    dies,
                    progress: (total / (infos?.length ?? 0)) * 100,
                    status: InstanceStatus.PAUSED,
                    statusMessage: 'Saldo insuficiente !'
                })

                return done(null, 'Paused insufficient funds');
            }

            const {data} = await axios.get(instanceData?.gateway?.apiUrl ?? '', {
                params: {
                    info
                }
            })

            total++;

            if (data?.toUpperCase().includes(instanceData?.gateway?.expectedResponse)) {
                lives++;
                io.emit(instanceId, {
                    lives,
                    dies,
                    progress: (total / (infos?.length ?? 0)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS
                })

                await prisma.info.update({
                    where: {
                        id: info?.id
                    },
                    data: {
                        status: InfoStatus.LIVE,
                    }
                })

                await prisma.user.update({
                    where: {
                        id: user?.id
                    },
                    data: {
                        credits
                    }
                })

                await prisma.instance.update({
                    where: {
                        id: instanceId
                    },
                    data: {
                        dies,
                        lives,
                        progress: (total / (infos?.length ?? 0)) * 100
                    }
                })
            } else {
                dies++;
                io.emit(instanceId, {
                    lives,
                    dies,
                    progress: (total / (infos?.length ?? 0)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS
                })

                await prisma.info.update({
                    where: {
                        id: info?.id
                    },
                    data: {
                        status: InfoStatus.DIE
                    }
                })

                await prisma.instance.update({
                    where: {
                        id: instanceId
                    },
                    data: {
                        dies,
                        lives,
                        progress: (total / (infos?.length ?? 0)) * 100
                    }
                })
            }
        }

        io.emit(instanceId, {
            lives,
            dies,
            progress: (total / (infos?.length ?? 0)) * 100,
            status: InstanceStatus.COMPLETED,
            statusMessage: null
        })

        await prisma.instance.update({
            where: {
                id: instanceId
            },
            data: {
                status: InstanceStatus.COMPLETED,
                lives,
                dies
            }
        })

        return done(null, 'Success');
    } catch (e: any) {
        await prisma.instance.update({
            where: {
                id: job.data.instance
            },
            data: {
                status: InstanceStatus.CANCELLED,
                statusMessage: "Houve um erro, tente novamente."
            }
        })

        await prisma.errors.create({
            data: {
                instanceId: job.data.instance,
                errorMessage: e?.message
            }
        })

        console.log(`[Instância error] - ${e?.message}`);
        return done(null, 'Error');
    } finally {
        console.log(`[Instância finalizada] - ${job.data.instance}`);
    }
});