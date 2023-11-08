import {prisma} from "@/globals";
import {Info, InfoStatus, InstanceStatus} from "@prisma/client";
import axios from "axios";
import {io} from "@/index";

class InstanceConsumer {
    constructor() {
        this.total = 0;
        this.lives = 0;
        this.dies = 0;
    }

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
        this.total = (counts?.find((count) => count.status === 'LIVE')?._count?.status ?? 0) + (counts?.find((count) => count.status === 'DIE')?._count?.status ?? 0);

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


        let promises = []
        for await (const info of infos ?? []) {
            promises.push(this.CHECK(info, instanceData, infos));
        }

        const promiseResponse = await Promise.all(promises);

        if (!promiseResponse?.some((inst: any) => inst?.includes('Paused insufficient funds'))) {
            const instance = await prisma.instance.findUnique({
                where: {
                    id: instanceId
                }
            })

            if (instance?.status !== InstanceStatus.PAUSED && instance?.status !== InstanceStatus.CANCELLED) {
                io.emit(instanceId, {
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.total / (infos?.length ?? 0)) * 100,
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
    }

    private CHECK = async (info: Info, instanceData: any, infos: any) => {
        try {
            const instance = await prisma.instance.findUnique({
                where: {
                    id: instanceData?.id
                }
            })

            if (!instance) {
                return 'Instance not found !';
            }

            if (instance?.status === InstanceStatus.PAUSED || instance?.status === InstanceStatus.CANCELLED) {
                return instance?.status
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

                io.emit(instance?.id, {
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.total / (infos?.length ?? 0)) * 100,
                    status: InstanceStatus.PAUSED,
                    statusMessage: 'Saldo insuficiente !'
                })

                return 'Paused insufficient funds';
            }

            this.total++;
            const {data} = await axios.get(`${instanceData?.gateway?.apiUrl}?lista=${info?.cc}`)

            if (data?.toString()?.toUpperCase().includes(instanceData?.gateway?.expectedResponse?.toUpperCase())) {
                this.lives++;
                io.emit(instance?.id, {
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.total / (infos?.length ?? 0)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS,
                    info
                })

                const updatedInfo = await prisma.info.update({
                    where: {
                        id: info?.id
                    },
                    data: {
                        status: InfoStatus.LIVE,
                        response: data?.toString()
                    }
                })

                io.emit(instance?.id, {
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.total / (infos?.length ?? 0)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS,
                    info: updatedInfo
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
                        id: instance?.id
                    },
                    data: {
                        lives: this.lives,
                        dies: this.dies,
                        progress: (this.total / (infos?.length ?? 0)) * 100
                    }
                })
            } else {
                this.dies++;
                const updatedInfo = await prisma.info.update({
                    where: {
                        id: info?.id
                    },
                    data: {
                        status: InfoStatus.DIE,
                        response: data?.toString()
                    }
                })

                io.emit(instance?.id, {
                    lives: this.lives,
                    dies: this.dies,
                    progress: (this.total / (infos?.length ?? 0)) * 100,
                    statusMessage: null,
                    status: InstanceStatus.PROGRESS,
                    info: updatedInfo
                })

                await prisma.instance.update({
                    where: {
                        id: instance?.id
                    },
                    data: {
                        lives: this.lives,
                        dies: this.dies,
                        progress: (this.total / (infos?.length ?? 0)) * 100
                    }
                })
            }


            return 'Ok';
        } catch (e: any) {
            this.dies++;
            const instance = await prisma.instance.findUnique({
                where: {
                    id: instanceData?.id
                }
            })

            const updatedInfo = await prisma.info.update({
                where: {
                    id: info?.id
                },
                data: {
                    status: InfoStatus.DIE,
                    response: 'Houve um erro'
                }
            })

            io.emit(instance?.id ?? '', {
                lives: this.lives,
                dies: this.dies,
                progress: (this.total / (infos?.length ?? 0)) * 100,
                statusMessage: null,
                status: InstanceStatus.PROGRESS,
                info: updatedInfo
            })

            return 'Error';
        }
    }
}

export const instanceConsumer = new InstanceConsumer();