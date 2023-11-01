import {Response} from "express";
import * as bcrypt from 'bcrypt'
import * as JWT from 'jsonwebtoken';
import * as process from "process";
import {IAuthRequest} from "@/routes/types";
import {prisma} from "@/globals";
import {UserRole} from "@prisma/client";

const UserController = () => {
    const register = async (req: IAuthRequest, res: Response) => {
        try {
            if (process.env.NODE_ENV !== "development") {
                return res.status(401).send('Unauthorized')
            }
            const {password, username} = req.body;

            const userExists = await prisma.user.findFirst({
                where: {
                    OR: [
                        {username}
                    ]
                },
            })

            if (userExists) {
                return res.status(400).send('User already exists')
            }

            await prisma.user.create({
                data: {
                    username,
                    password: bcrypt.hashSync(password, 12)
                }
            })

            return res.send("User successfully registered")
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const login = async (req: IAuthRequest, res: Response) => {
        try {
            const {username, password} = req.body;

            const user = await prisma.user.findUnique({
                where: {
                    username
                }
            });

            if (!user) {
                return res.status(404).send('Email ou senha inválida')
            }

            if (!user?.active) {
                return res.status(404).send('Usuário não está ativado')
            }

            const validatePassword = await bcrypt.compare(password, user.password);

            if (!validatePassword) {
                return res.status(404).send('Email ou senha inválida')
            }

            const SECRET: string = process.env.SECRET || 'SECRET';
            const token = JWT.sign({}, SECRET, {issuer: user.id, expiresIn: '1 day'})

            await prisma.user.update({
                where: {
                    username
                },
                data: {
                    token
                }
            })

            return res.send({
                id: user.id,
                username: user.username,
                credits: user.credits,
                role: user.role,
                accessToken: token,
                createdAt: user?.createdAt,
                active: user?.active
            })
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const me = async (req: IAuthRequest, res: Response) => {
        try {
            const user = req?.user;
            if (!user) {
                return res.status(401).send('Unauthorized')
            }
            return res.send({
                id: user.id,
                username: user.username,
                credits: user.credits,
                role: user.role,
                createdAt: user?.createdAt,
                active: user?.active
            })
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const remove = async (req: IAuthRequest, res: Response) => {
        try {
            const {id} = req.params;

            await prisma.user.delete({
                where: {
                    id
                }
            })

            return res.send('Usuário deletado com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const get = async (_: IAuthRequest, res: Response) => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    active: true,
                    role: true,
                    credits: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: {
                    username: "asc"
                }
            });
            return res.send({users})
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const update = async (req: IAuthRequest, res: Response) => {
        try {
            const body = req.body;
            const reqUser = req?.user;

            const user = await prisma.user.findUnique({
                where: {
                    id: body?.id
                }
            })

            if (!user) {
                return res.status(404).send("User not found !")
            }

            if (reqUser?.role === UserRole.ADMIN && user?.role === UserRole.OWNER) {
                return res.status(401).send("Unauthorized")
            }

            await prisma.user.update({
                where: {
                    id: body?.id
                },
                data: {
                    ...(body?.username && {username: body?.username}),
                    ...(body?.role && {role: body?.role}),
                    ...(body?.active && {active: body?.active === 'true'}),
                    ...(body?.credits && {credits: parseInt(user?.credits?.toString() ?? '0') + parseInt(body?.credits)}),
                }
            })

            return res.send('Usuário atualizado com sucesso !');
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    const create = async (req: IAuthRequest, res: Response) => {
        try {
            const {username, password, active, role} = req.body;

            await prisma.user.create({
                data: {
                    username,
                    password: bcrypt.hashSync(password, 12),
                    active: active === 'true',
                    role
                }
            })

            return res.send('Usuário criado com sucesso !')
        } catch (e: any) {
            return res.status(500).send(e?.message)
        }
    }

    return {register, login, me, remove, get, update, create}
}

export default UserController()