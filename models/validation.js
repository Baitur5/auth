const User = require("./User");

const Joi = require("joi");

const registerSchema = Joi.object({
  fname: Joi.string().min(3).required(),
  lname: Joi.string().min(3).required(),
  email: Joi.string().min(7).required().email(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().min(7).required().email(),
  password: Joi.string().min(6).required(),
});

const forgotSchema = Joi.object({
  email: Joi.string().min(7).required().email(),
});

const resetSchema = Joi.object({
  email: Joi.string().min(7).required().email(),
  secretKey: Joi.string().min(5).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string().min(6).required(),
});

module.exports = { registerSchema, loginSchema, forgotSchema, resetSchema };
