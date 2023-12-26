import {prisma} from "@/globals";

export const initDatabaseConfig = async () => {
    try {
        console.log("[*] Preenchendo config padrao")
        const hasConfigMaintenance = await prisma.config.findFirst({
            where: {
                name: 'maintenance'
            }
        })
        if (!hasConfigMaintenance) {
            await prisma.config.create({
                data: {
                    name: 'maintenance',
                    value: 'false'
                }
            })
        }
        console.log("[+] Config padrao preenchida")
    } catch (e: any) {
        console.error("ERRO AO INICIAR DATABASE CONFIG: ", e?.message)
    }
}
