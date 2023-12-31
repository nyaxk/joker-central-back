import Joi from "joi";

export const UpdatePlanSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().optional(),
    amount: Joi.number().optional(),
    active: Joi.boolean().optional(),
    price: Joi.any().required(),
})

export const CreatePlanSchema = Joi.object({
    name: Joi.string().required(),
    amount: Joi.number().required(),
    active: Joi.boolean().required(),
    price: Joi.any().required(),
})