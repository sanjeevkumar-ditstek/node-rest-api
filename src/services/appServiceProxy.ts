
import * as IUserAuthService from './user/auth/IAuthService';
import UserAuthService from './user/auth/authService';


export interface IAppServiceProxy {
  userAuth: IUserAuthService.IAuthServiceAPI;
}

class AppServiceProxy implements IAppServiceProxy {
  public userAuth: IUserAuthService.IAuthServiceAPI;
  constructor() {
    this.userAuth = new UserAuthService(this);
  }
}

export default new AppServiceProxy();
