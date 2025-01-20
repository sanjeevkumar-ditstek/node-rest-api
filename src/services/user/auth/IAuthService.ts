import { IUSER } from '../../../utils/interface';
import { IResponse, IExpressResponse } from '../../../utils/interface/common';
import { Request } from 'express';

export interface IAuthServiceAPI {
  register(request: IRegisterUserRequest, response: IRegisterUserResponse): void;
  login(request: ILoginUserRequest, response: ILoginUserResponse): void;
  test(request: any, response: any): void;
}

/********************************************************************************
 *  Register User
 ********************************************************************************/
export interface IRegisterUserRequest extends Request {
  body: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  };
}

export interface IRegisterUserResponse extends IResponse {
  response: IExpressResponse;
  user?: IUSER;
}

/********************************************************************************
 *  Login User
 ********************************************************************************/
export interface ILoginUserRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface ILoginUserResponse extends IResponse {
  response: IExpressResponse;
  user?: IUSER;
}