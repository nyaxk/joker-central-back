import Joi from "joi";

export const CreateInstanceSchema = Joi.object({
    cc: Joi.array().required(),
    gate: Joi.string().required()
})

export const ResumeInstanceSchema = Joi.object({
    instanceId: Joi.string().required(),
})