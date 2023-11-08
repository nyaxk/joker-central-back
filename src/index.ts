import 'dotenv/config';
import express from 'express'
import {routes} from './routes'
import cors from 'cors';
import Queue from 'bee-queue';
import {Server} from "socket.io";
import * as process from "process";
import {prisma} from "@/globals";
import {InstanceStatus} from "@prisma/client";
import {instanceConsumer} from "@/consumers";

const REDIS_URL = process.env.REDIS_URL ?? '';

const app = express();

export const InstanceQueue = new Queue('consumer-instance', {
    redis: {url: REDIS_URL},
});

const PORT: number = parseInt(process.env.PORT ?? '') || 4000;

app.use(express.json())
app.use(cors())
app.use('/static', express.static('public'))

const router = express.Router();

routes.forEach((route) => {
    const {method, path, middleware, handler} = route;
    router[method](path, ...middleware, handler as any)
})

router.get('/test', async (_, res) => {
    // const response = await Paramount('5346960523033881|08|2026|000');
    // return res.send(response)
    // try {
    //     const {lista} = req.query;
    //     const {data} = await axios.get(`http://ec2-52-67-2-206.sa-east-1.compute.amazonaws.com/api/api.php?lista=${lista}`)
    //
    //     console.log('DATA:', data)
    //
    //     return res.send(data)
    // } catch (e: any) {
    //     console.log(e?.message)
    //     return res.status(500).send(e?.message)
    // }

    await new Promise(r => setTimeout(r, 5000));
    const textArray = [
        '#Live',
        '#Die'
    ];
    const randomNumber = Math.floor(Math.random() * textArray.length);
    return res.send(textArray[randomNumber])
})


app.use('/api', router)
app.get('*', (_, res) => res.status(401).send('Unauthorized'))


const server = app.listen(PORT, () => {
    console.log("[+] Servidor iniciado na porta:", PORT)
})

export const io = new Server(server, {
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
        console.log(`[Executando instância] - ${instanceId}`);

        await instanceConsumer.INIT(instanceId);

        return done(null, 'Success');
    } catch (e: any) {
        const instance = await prisma.instance.update({
            where: {
                id: job.data.instance
            },
            data: {
                status: InstanceStatus.CANCELLED,
                statusMessage: "Houve um erro, tente novamente."
            }
        })

        io.emit(instanceId, {
            lives: instance.lives,
            dies: instance.dies,
            progress: instance.progress,
            status: InstanceStatus.CANCELLED,
            statusMessage: "Houve um erro, tente novamente."
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