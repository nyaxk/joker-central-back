import {Route} from "@/routes/types";
import PlanController from "@/controllers/plan";
import Auth from "@/middlewares/auth";
import OnlyOwner from "@/middlewares/only-owner";
import {CreatePlanSchema, UpdatePlanSchema} from "@/validator/plan";
import expressValidator from "express-joi-validation";
const Validator = expressValidator.createValidator({});

export const route: Route[] = [
    {
        path: '/admin/plan',
        method: 'post',
        middleware: [Auth as any, OnlyOwner, Validator.body(CreatePlanSchema)],
        handler: PlanController.create
    },
    {
        path: '/admin/plan',
        method: 'put',
        middleware: [Auth as any, OnlyOwner, Validator.body(UpdatePlanSchema)],
        handler: PlanController.update
    },
    {
        path: '/admin/plan',
        method: 'get',
        middleware: [Auth as any, OnlyOwner],
        handler: PlanController.get
    },
    {
        path: '/admin/plan/:id',
        method: 'delete',
        middleware: [Auth as any, OnlyOwner],
        handler: PlanController.remove
    },
]