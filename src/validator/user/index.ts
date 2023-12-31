import Joi from "joi";

export const RegisterUserSchema = Joi.object({
    username: Joi.string().required(),
    // email: Joi.string().email().required(),
    password: Joi.string(),
    // recaptchaToken: Joi.string().required()
})

export const LoginUserSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string(),
    recaptchaToken: Joi.string().required()
})

export const UpdateUserSchema = Joi.object({
    id: Joi.string().required(),
    username: Joi.any().optional(),
    role: Joi.any().optional(),
    active: Joi.any().optional(),
    credits: Joi.any().optional(),
})

export const ChangePasswordUserSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmationPassword: Joi.string().required(),
})

export const ChangeCaptchaUserSchema = Joi.object({
    captchaKey: Joi.string().required(),
})
