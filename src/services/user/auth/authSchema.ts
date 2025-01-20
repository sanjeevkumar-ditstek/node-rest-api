import Joi from 'joi';
import LoginSource from '../../../utils/enum/loginSource';

export const registerSchema = Joi.object().keys({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const loginSchema = Joi.object().keys({
  loginSource: Joi.string()
    .valid(LoginSource.EMAIL, LoginSource.GOOGLE, LoginSource.APPLE)
    .required(),
  email: Joi.when('loginSource', {
    is: LoginSource.EMAIL,
    then: Joi.string().email().required(),
    otherwise: Joi.forbidden()
  }),
  password: Joi.when('loginSource', {
    is: LoginSource.EMAIL,
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  socialToken: Joi.when('loginSource', {
    is: Joi.valid(LoginSource.GOOGLE, LoginSource.APPLE),
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  })
});
