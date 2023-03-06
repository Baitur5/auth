const User = require("./User");

const Joi = require("joi");

const registerSchema = Joi.object({
    fname: Joi.string().min(3).required(),
    lname: Joi.string().min(3).required(),
    email: Joi.string().min(7).required().email(),
    password: Joi.string().min(6).required(),
    isAdmin: Joi.boolean()
});

const loginSchema = Joi.object({
    email: Joi.string().min(7).required().email(),
    password: Joi.string().min(6).required(),
});

const updateSchema = Joi.object({
    old_password: Joi.string().min(6).required(),
    new_password: Joi.string().min(6).required(),
    new_password_confirm: Joi.string()
        .valid(Joi.ref("new_password"))
        .required()
        .messages({
            "any.only": "New password and confirm password do not match",
        }),
});

const forgotSchema = Joi.object({
    email: Joi.string().min(7).required().email(),
});

const activateSchema = Joi.object({
    email: Joi.string().min(7).required().email(),
    secretKey: Joi.string().min(5).required(),
});

const resetSchema = Joi.object({
    email: Joi.string().min(7).required().email(),
    secretKey: Joi.string().min(5).required(),
    password: Joi.string().min(6).required(),
    confirm_password: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "New password and confirm password do not match",
        }),
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotSchema,
    resetSchema,
    updateSchema,
    activateSchema,
};
