import {route as UserRoute} from './user'
import {route as InstanceRoute} from './instance'
import {route as GatewayRoute} from './gateway'
import {route as InfoRoute} from './info'
import {route as PlanRoute} from './plan'
import {route as RechargesHistoryRoute} from './recharges/history'
import {Route} from "@/routes/types";

export const routes: Route[] = [
    ...UserRoute,
    ...InstanceRoute,
    ...GatewayRoute,
    ...InfoRoute,
    ...PlanRoute,
    ...RechargesHistoryRoute
]