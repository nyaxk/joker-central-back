import {prisma} from "@/globals";
import {Info, InfoStatus, InstanceStatus} from "@prisma/client";
import axios from "axios";
import {UserQueue, EmitSocket} from "@/index";

const canDecrementBalance = async (userId: string) => {
    const job = UserQueue.createJob({userId, type: 'canDecrementBalance'});
    await job.save();
    return await new Promise((resolve) => {
        job.on('succeeded', (result) => {
            return resolve(result)
        });
    })
}

const decrementBalance = async (userId: string) => {
    const job = UserQueue.createJob({userId, type: 'decrementBalance'});
    await job.save();
    return await new Promise((resolve) => {
        job.on('succeeded', (result) => {
            return resolve(result)
        });
    })
}

const incrementLives = async (userId: string) => {
    const job = UserQueue.createJob({userId, type: 'incrementLives'});
    await job.save();
    return await new Promise((resolve) => {
        job.on('succeeded', (result) => {
            return resolve(result)
        });
    })
}

const emitSocket = async (to: string, body: any) => {
    const job = EmitSocket.createJob({to, body});
    await job.save();
    return await new Promise((resolve) => {
        job.on('succeeded', (result) => {
            return resolve(result)
        });
    })
}

class InstanceConsumer {
    constructor() {
        this.tested = 0;
        this.lives = 0;
        this.dies = 0;
        this.total = 0;
    }

    private tested: number;
    private total: number;
    private lives: number;
    private dies: number;

    INIT = async (instanceId: string) => {
        const counts = await prisma.info.groupBy({
            by: ['status'],
            where: {
                instanceId
            },
            _count: {
                status: true
            }
        })

        this.lives = counts?.find((count) => count.status === 'LIVE')?._count?.status ?? 0;
        this.dies = counts?.find((count) => count.status === 'DIE')?._count?.status ?? 0;
        this.tested = (counts?.find((count) => count.status === 'LIVE')?._count?.status ?? 0) + (counts?.find((count) => count.status === 'DIE')?._count?.status ?? 0);
        this.total = (counts?.find((count) => count.status === 'LIVE')?._count?.status ?? 0) + (counts?.find((count) => count.status === 'DIE')?._count?.status ?? 0) + (counts?.find((count) => count.status === 'TESTING')?._count?.status ?? 0);

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

        const promises = [];

        for await (const info of infos ?? []) {
            promises.push(this.CHECK(info, instanceData))
        }

        try {
            const promiseResponse = await Promise.all(promises);
            if (!promiseResponse?.some((inst: any) => inst?.includes('Paused insufficient funds'))) {
                const instance = await prisma.instance.findUnique({
                    where: {
                        id: instanceId
                    }
                })

                if (instance?.status !== InstanceStatus.PAUSED && instance?.status !== InstanceStatus.CANCELLED) {
                    await emitSocket(instanceId, {
                        id: instanceId,
                        lives: this.lives,
                        dies: this.dies,
                        progress: (this.tested / (this.total)) * 100,
                        status: InstanceStatus.COMPLETED,
                        statusMessage: null
                    })

                    await prisma.instance.update({
                        where: {
                            id: instanceId
                        },
                        data: {
                            status: InstanceStatus.COMPLETED,
                            lives: this.lives,
                            dies: this.dies
                        }
                    })
                }
            }
        } catch (_) {
        }

    }

    private CHECK = async (info: Info, instanceData: any) => {
        try {
            const [instance, user] = await prisma.$transaction([
                prisma.instance.findUnique({
                    where: {
                        id: instanceData?.id
                    }
                }),
                prisma.user.findUnique({
                    where: {
                        id: instanceData?.user?.id
                    }
                })
            ])

            if (!instance) {
                return 'Instance not found !';
            }

            if (instance?.status === InstanceStatus.PAUSED || instance?.status === InstanceStatus.CANCELLED) {
                return instance?.status
            }

            const canDecrement = await canDecrementBalance(user?.id ?? '');

            if (!canDecrement) {
                await prisma.instance.update({
                    where: {
                        id: instanceData?.id
                    },
                    data: {
                        status: InstanceStatus.PAUSED,
                        statusMessage: 'Saldo insuficiente !'
                    }
                })

                await emitSocket(instance?.id, {
                    id: instance?.id,
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.tested / (this.total)) * 100,
                    status: InstanceStatus.PAUSED,
                    statusMessage: 'Saldo insuficiente !'
                })

                throw new Error('Paused insufficient funds')
            }

            const {data} = await axios.get(`${instanceData?.gateway?.apiUrl}?lista=${info?.cc}`)

            if (data?.toString()?.toUpperCase().includes(instanceData?.gateway?.expectedResponse?.toUpperCase())) {
                const decrementCredits = await decrementBalance(user?.id ?? '');

                if (!decrementCredits) {
                    await prisma.$transaction([
                        prisma.instance.update({
                            where: {
                                id: instanceData?.id
                            },
                            data: {
                                status: InstanceStatus.PAUSED,
                                statusMessage: 'Saldo insuficiente !'
                            }
                        }),
                    ])

                    await emitSocket(instance?.id, {
                        id: instance?.id,
                        lives: this.lives,
                        dies: this.dies,
                        progress: (this.tested / (this.total)) * 100,
                        status: InstanceStatus.PAUSED,
                        statusMessage: 'Saldo insuficiente !'
                    })

                    return 'Paused insufficient funds';
                }

                this.lives++;
                this.tested++;

                await incrementLives(user?.id ?? '')

                const [updatedInfo] = await prisma.$transaction([
                    prisma.info.update({
                        where: {
                            id: info?.id
                        },
                        data: {
                            status: InfoStatus.LIVE,
                            response: data?.toString()
                        }
                    }),
                    prisma.instance.update({
                        where: {
                            id: instance?.id
                        },
                        data: {
                            lives: this.lives,
                            dies: this.dies,
                            progress: (this.tested / (this.total)) * 100
                        }
                    }),
                ])

                await emitSocket(instance?.id, {
                    id: instance?.id,
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.tested / (this.total)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS,
                    info: updatedInfo
                })
            } else {
                this.dies++;
                this.tested++;

                const [updatedInfo] = await prisma.$transaction([
                    prisma.info.update({
                        where: {
                            id: info?.id
                        },
                        data: {
                            status: InfoStatus.DIE,
                            response: data?.toString()
                        }
                    }),
                    prisma.instance.update({
                        where: {
                            id: instance?.id
                        },
                        data: {
                            lives: this.lives,
                            dies: this.dies,
                            progress: (this.tested / (this.total)) * 100
                        }
                    })
                ])

                await emitSocket(instance?.id, {
                    id: instance?.id,
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.tested / (this.total)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS,
                    info: updatedInfo
                })
            }


            return 'Ok';
        } catch (e: any) {
            if (e?.message === 'Paused insufficient funds') {
                throw new Error('Paused insufficient funds')
            }
            this.dies++;
            this.tested++;

            const [instance, updatedInfo] = await prisma.$transaction([
                prisma.instance.findUnique({
                    where: {
                        id: instanceData?.id
                    }
                }),
                prisma.info.update({
                    where: {
                        id: info?.id
                    },
                    data: {
                        status: InfoStatus.DIE,
                        response: 'Houve um erro'
                    }
                }),
            ])

            await prisma.instance.update({
                where: {
                    id: instance?.id
                },
                data: {
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.tested / (this.total)) * 100
                }
            })

            await emitSocket(instance?.id ?? '', {
                id: instance?.id,
                lives: this.lives,
                dies: this.dies,
                progress: (this.tested / (this.total)) * 100,
                statusMessage: null,
                status: InstanceStatus.PROGRESS,
                info: updatedInfo
            })

            return 'Error';
        }
    }
}

export default InstanceConsumer;