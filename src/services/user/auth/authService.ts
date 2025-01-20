import AuthStore from './authStore';
import { IUSER } from '../../../utils/interface/';
import STATUS_CODES from '../../../utils/enum/statusCodes';
import ErrorMessageEnum from '../../../utils/enum/errorMessage';
import SuccessMessageEnum from '../../../utils/enum/responseMessage';
import * as IAuthService from './IAuthService';
import { IAppServiceProxy } from '../../appServiceProxy';
import { IApiResponse, toError } from '../../../utils/interface/common';
import { apiResponse } from '../../../helper/apiResponses';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { registerSchema, loginSchema } from './authSchema';
import { JoiError } from '../../../helper/JoiValidate';
import { JoiValidate } from '../../../helper/JoiValidate';
import logger from '../../../utils/logger/winston';
import CrudStore from '../../common/crudStore';
import { UserModel } from '../../../db/models';
import LoginSource from '../../../utils/enum/loginSource';
import AuthService from '../../../utils/auth/authService';

export default class UserAuthService implements IAuthService.IAuthServiceAPI {
  private crudStore = new CrudStore(UserModel); // Initialize CrudStore with UserModel
  private authStore = new AuthStore();
  private proxy: IAppServiceProxy;
  private authService: AuthService;
  constructor(proxy: IAppServiceProxy) {
    this.proxy = proxy;
    this.authService = new AuthService(proxy);
  }

  /**
   * Registers a new user in the system.
   *
   * @param req - The request object containing the user registration details such as firstname, lastname, email, and password.
   * @param res - The response object used to send back the API response.
   * @returns A promise that resolves to an API response containing the newly created user or an error message.
   */
  public register = async (
    req: IAuthService.IRegisterUserRequest,
    res: IAuthService.IRegisterUserResponse
  ) => {
    const response: IApiResponse = {
      response: res,
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: ErrorMessageEnum.INTERNAL_ERROR,
      data: null,
      status: false,
      error: null
    };
    const { error, value } = JoiValidate(registerSchema, req.body);
    if (error) {
      const paramsError = JoiError(error);
      response.statusCode = STATUS_CODES.UNPROCESSABLE_ENTITY;
      response.message = ErrorMessageEnum.REQUEST_PARAMS_ERROR;
      response.data = null;
      response.status = false;
      response.error = paramsError;
      return apiResponse(response);
    }
    const { firstname, lastname, email, password } = value;
    // Check if email is already registered
    let existingUser: IUSER;
    try {
      existingUser = await this.crudStore.getSingle(
        'email',
        email.toLowerCase()
      );
      console.log('existingUser: ', existingUser);
      //Return error resposne  if email id is already exist
      if (existingUser && existingUser?.email) {
        response.statusCode = STATUS_CODES.BAD_REQUEST;
        response.message = ErrorMessageEnum.EMAIL_ALREADY_EXIST;
        response.data = null;
        response.status = false;
        response.error = toError(ErrorMessageEnum.EMAIL_ALREADY_EXIST);
        return apiResponse(response);
      }
      //Hash the password and create new user
      const hashPassword = await bcrypt.hash(password, 10);
      const attributes: IUSER = {
        firstname,
        lastname,
        email: email.toLowerCase(),
        password: hashPassword
      };
      const user: IUSER = await this.crudStore.create(attributes);
      response.statusCode = STATUS_CODES.OK;
      response.message = SuccessMessageEnum.USER_CREATED;
      response.data = user;
      response.status = true;
      response.error = null;
      return apiResponse(response);
    } catch (e) {
      logger.error(e);
      response.statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
      response.message = ErrorMessageEnum.INTERNAL_ERROR;
      response.data = null;
      response.status = false;
      response.error = toError(e.message);
      return apiResponse(response);
    }
  };

  /**
   * Handles user login based on the provided credentials and login source (email, Google, or Apple).
   *
   * @param req - The request object containing login credentials and login source information.
   * @param res - The response object used to send back the API response.
   * @returns A promise that resolves to an API response containing the user data and JWT token or an error message.
   */
  public login = async (
    req: IAuthService.ILoginUserRequest,
    res: IAuthService.ILoginUserResponse
  ) => {
    const response: IApiResponse = {
      response: res,
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: ErrorMessageEnum.INTERNAL_ERROR,
      data: null,
      status: false
    };
    let user: IUSER;
    const { error, value } = JoiValidate(loginSchema, req.body);
    if (error) {
      logger.error(error);
      const paramsError = JoiError(error);
      response.statusCode = STATUS_CODES.UNPROCESSABLE_ENTITY;
      response.message = ErrorMessageEnum.REQUEST_PARAMS_ERROR;
      response.data = null;
      response.status = false;
      response.error = paramsError;
      return apiResponse(response);
    }
    try {
      if (value.loginSource === LoginSource.EMAIL) {
        const { email, password } = req.body;
        user = await this.crudStore.getSingle(
          'email',
          email.toLocaleLowerCase()
        );
        if (!user) {
          response.statusCode = STATUS_CODES.BAD_REQUEST;
          response.message = ErrorMessageEnum.USER_NOT_EXIST;
          response.data = null;
          response.status = false;
          response.error = toError(ErrorMessageEnum.USER_NOT_EXIST);
          return apiResponse(response);
        }
        console.log('password: ', password, user.password);
        const isValid = await bcrypt.compare(password, user?.password);
        console.log('isValid: ', isValid);

        //if isValid or user.password is null
        if (!isValid || !user?.password) {
          const errorMsg = SuccessMessageEnum.INVALID_CREDENTIALS;
          response.statusCode = STATUS_CODES.UNAUTHORIZED;
          response.error = toError(errorMsg);
          response.message = errorMsg;
          return apiResponse(response);
        }
        delete user['password'];

        // Generate JWT token using AuthService's generateToken method
        const token: string = this.authService.generateJwtToken({
          _id: user?._id,
          email: user?.email
        });

        response.statusCode = STATUS_CODES.OK;
        response.message = SuccessMessageEnum.USER_LOGIN;
        response.data = { user, token };
        response.status = true;
        response.error = null;
        return apiResponse(response);
      }
      // else if (value.loginSource === LoginSource.GOOGLE) {
      //   const result = await verifyGoogleToken(value.socialToken);
      //   if (result.valid) {
      //     let user: IUSER = await this.userStore.getByEmail(
      //       result?.payload?.email
      //     );
      //     if (user) {
      //       const payload = {
      //         firstname: result?.payload?.given_name?.trim(),
      //         lastname: result?.payload?.family_name?.trim(),
      //         login_source: value.loginSource,
      //         google_token: result.payload.sub
      //       };
      //       user = await this.userStore.update(user._id, payload);
      //       const token: string = this.generateJWT(user);
      //       response.statusCode = STATUS_CODES.OK;
      //       response.message = responseMessage.USER_LOGIN;
      //       response.data = { user, token };
      //       response.status = true;
      //       response.error = null;
      //       return apiResponse(response);
      //     } else {
      //       const payload = {
      //         token: result?.payload?.sub,
      //         loginSource: value?.loginSource
      //       };
      //       const userBySocialToken: IUSER =
      //         await this.userStore.getBySocialToken(payload);
      //       if (userBySocialToken) {
      //         const payload = {
      //           email: result?.payload?.email,
      //           firstname: result?.payload?.given_name?.trim(),
      //           lastname: result?.payload?.family_name?.trim(),
      //           login_source: value.loginSource,
      //           google_token: result.payload.sub
      //         };
      //         const user: IUSER = await this.userStore.update(
      //           userBySocialToken._id,
      //           payload
      //         );
      //         const token: string = this.generateJWT(user);
      //         response.statusCode = STATUS_CODES.OK;
      //         response.message = responseMessage.USER_LOGIN;
      //         response.data = { user, token };
      //         response.status = true;
      //         response.error = null;
      //         return apiResponse(response);
      //       } else {
      //         // create new user and return token
      //         const payload = {
      //           email: result?.payload?.email,
      //           firstname: result?.payload?.given_name?.trim(),
      //           lastname: result?.payload?.family_name?.trim(),
      //           login_source: value.loginSource,
      //           google_token: result.payload.sub
      //         };
      //         const user: IUSER = await this.userStore.createUser(payload);
      //         const token: string = this.generateJWT(user);
      //         response.statusCode = STATUS_CODES.OK;
      //         response.message = responseMessage.USER_LOGIN;
      //         response.data = { user, token };
      //         response.status = true;
      //         response.error = null;
      //         return apiResponse(response);
      //       }
      //     }
      //   } else {
      //     const errorMsg = responseMessage.INVALID_CREDENTIALS;
      //     response.message = ErrorMessageEnum.UNAUTHORIZED;
      //     response.statusCode = STATUS_CODES.UNAUTHORIZED;
      //     response.error = toError(errorMsg);
      //     return apiResponse(response);
      //   }
      // }
      // else if (value.loginSource === LoginSource.APPLE) {
      //   const result = await verifyAppleToken(value.socialToken);
      //   if (result.valid) {
      //     let user: IUSER = await this.userStore.getByEmail(
      //       result?.payload?.email
      //     );
      //     if (user) {
      //       const payload = {
      //         login_source: value.loginSource,
      //         apple_token: result.payload.sub
      //       };
      //       user = await this.userStore.update(user._id, payload);
      //       const token: string = this.generateJWT(user);
      //       response.statusCode = STATUS_CODES.OK;
      //       response.message = responseMessage.USER_LOGIN;
      //       response.data = { user, token };
      //       response.status = true;
      //       response.error = null;
      //       return apiResponse(response);
      //     } else {
      //       const payload = {
      //         token: result?.payload?.sub,
      //         loginSource: value?.loginSource
      //       };
      //       const userBySocialToken: IUSER =
      //         await this.userStore.getBySocialToken(payload);
      //       if (userBySocialToken) {
      //         const payload = {
      //           email: result?.payload?.email,
      //           login_source: value.loginSource,
      //           apple_token: result.payload.sub
      //         };
      //         const user: IUSER = await this.userStore.update(
      //           userBySocialToken._id,
      //           payload
      //         );
      //         const token: string = this.generateJWT(user);
      //         response.statusCode = STATUS_CODES.OK;
      //         response.message = responseMessage.USER_LOGIN;
      //         response.data = { user, token };
      //         response.status = true;
      //         response.error = null;
      //         return apiResponse(response);
      //       } else {
      //         // create new user and return token
      //         const payload = {
      //           email: result?.payload?.email,
      //           login_source: value.loginSource,
      //           google_token: result.payload.sub
      //         };
      //         const user: IUSER = await this.userStore.createUser(payload);
      //         const token: string = this.generateJWT(user);
      //         response.statusCode = STATUS_CODES.OK;
      //         response.message = responseMessage.USER_LOGIN;
      //         response.data = { user, token };
      //         response.status = true;
      //         response.error = null;
      //         return apiResponse(response);
      //       }
      //     }
      //   } else {
      //     const errorMsg = responseMessage.INVALID_CREDENTIALS;
      //     response.message = ErrorMessageEnum.UNAUTHORIZED;
      //     response.statusCode = STATUS_CODES.UNAUTHORIZED;
      //     response.error = toError(errorMsg);
      //     return apiResponse(response);
      //   }
      // }
    } catch (e) {
      logger.error(e);
      response.statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
      response.message = ErrorMessageEnum.INTERNAL_ERROR;
      response.data = null;
      response.status = false;
      response.error = toError(e.message);
      return apiResponse(response);
    }
  };
  public test = async (
    req: any,
    res: any
  ) => {
    const response: IApiResponse = {
      response: res,
      statusCode: STATUS_CODES.OK,
      message: SuccessMessageEnum.FILE_UPLOADED,
      data: null,
      status: false
    };
    try {
      return apiResponse(response)
    } catch (e) {
      logger.error(e);
      response.statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
      response.message = ErrorMessageEnum.INTERNAL_ERROR;
      response.data = null;
      response.status = false;
      response.error = toError(e.message);
      return apiResponse(response);
    }
  };
}
