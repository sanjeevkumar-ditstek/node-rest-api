import STATUS_CODES from '../../utils/enum/statusCodes';
import ErrorMessageEnum from '../../utils/enum/errorMessage';
import responseMessage from '../../utils/enum/responseMessage';
import * as IAuthService from './IAuthService';
import { IAppServiceProxy } from '../../services/appServiceProxy';
import { IApiResponse, toError } from '../../utils/interface/common';
import { apiResponse } from '../../helper/apiResponses';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import logger from '../../utils/logger/winston'
import { PermissionsModel, ModulesModel, RolesModel, UserModel } from '../../db/models';
import RoleLevel from '../enum/roleLevels';

export default class AuthService implements IAuthService.IAuthServiceAPI {
  private proxy: IAppServiceProxy;

  constructor(proxy: IAppServiceProxy) {
    this.proxy = proxy;
  }

  // public authenticate = async (
  //   req: IAuthService.IAuthRequest,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   const response: IApiResponse = {
  //     response: res,
  //     statusCode: STATUS_CODES.UNKNOWN_CODE,
  //     message: responseMessage.INVALID_EMAIL_OR_CODE,
  //     data: null,
  //     status: false
  //   };
  //   const token = req.headers.authorization;
  //   if (!token) {
  //     (response.statusCode = STATUS_CODES.BAD_REQUEST),
  //       (response.message = ErrorMessageEnum.MISSING_TOKEN);
  //     return apiResponse(response);
  //   }
  //   jwt.verify(
  //     token,
  //     process.env.JWT_SECRET,
  //     (error, data: IAuthService.IAuthJWTData) => {
  //       if (error) {
  //         logger.error(error);
  //         response.statusCode = STATUS_CODES.UNAUTHORIZED;
  //         response.message = ErrorMessageEnum.UNAUTHORIZED;
  //         response.data = null;
  //         response.status = false;
  //         response.error = toError(error.message);
  //         return apiResponse(response);
  //       } else if (data) {
  //         const { _id, email, role } = data;
  //         req.user = { _id, email, role };
  //       }
  //       return next();
  //     }
  //   );
  // };
  public authenticate = (requiredRole, requiredPermission, moduleName) => {
    return async (req, res, next) => {
      const response: IApiResponse = {
        response: res,
        statusCode: STATUS_CODES.UNKNOWN_CODE,
        message: responseMessage.INVALID_EMAIL_OR_CODE,
        data: null,
        status: false
      };
      // Step 1: Get the token from headers
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.statusCode = STATUS_CODES.UNAUTHORIZED;
        response.message = ErrorMessageEnum.INVALID_TOKEN;
        return apiResponse(response);
      }

      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET); // replace 'secretKey' with your actual secret
      } catch (error) {
        response.statusCode = STATUS_CODES.UNAUTHORIZED;
        response.message = ErrorMessageEnum.INVALID_TOKEN;
        return apiResponse(response);
      }

      // Step 2: Fetch the user from the database 
      const user = await UserModel.findOne({ _id: decoded._id })
      .populate({
        path: 'roles', // Populating roles
        populate: {
          path: 'permissions', // Populating permissions inside each role
          model: 'permissions', // Ensure the model is 'permissions'
          populate: {
            path: 'module', // Populating modules inside each permission
            model: 'modules', // Ensure the model is 'modules'
          }
        }
      })
      .lean();

      if (!user) {
        response.statusCode = STATUS_CODES.BAD_REQUEST;
        response.message = ErrorMessageEnum.USER_NOT_EXIST;
        return apiResponse(response);
      }

      // Step 3: Check for SuperAdmin role
      if (user.isSuperAdmin) {
        return next(); // If SuperAdmin, bypass further checks
      }

      // Step 4: Check if user has the required role
      const hasRequiredRole = user.roles.some(role => role?.role === requiredRole );
      if (!hasRequiredRole) {
        response.statusCode = STATUS_CODES.FORBIDDEN;
        response.message = ErrorMessageEnum.ACCESS_DENIED;
        return apiResponse(response);
      }

      // Step 5: Check for permissions
      const requiredModule = moduleName;
      const requiredActions = requiredPermission;

      const hasPermissionForModule = user.roles.some(role => {
        return role.permissions.some(permission=>
          permission.module.name === requiredModule && permission.action === requiredActions);
      });

      if (!hasPermissionForModule) {
        response.statusCode = STATUS_CODES.FORBIDDEN;
        response.message = ErrorMessageEnum.INSUFFICIENT_PERMISSIONS;
        return apiResponse(response);
      }

      // If all checks pass, allow access
      return next();
    };
  };
  /**
   * Generate JWT token for the given payload.
   * @param payload - The data to be signed in the JWT.
   * @returns A signed JWT token.
   */
  public generateJwtToken = (payload: IAuthService.IAuthJWTData): string => {
    try {
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION || '24h' // You can adjust expiration time as needed (e.g., '1h', '24h', etc.)
      });
      return token;
    } catch (error) {
      logger.error('Error generating token: ', error);
      throw new Error('Error generating token');
    }
  };
}
