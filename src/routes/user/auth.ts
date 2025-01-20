import proxy from '../../services/appServiceProxy';
import { userAuthRoutes } from '../../helper/routes';
import AuthService from '../../utils/auth/authService'
const authService = new AuthService(proxy); // Initialize AuthService

const authRoute = async (app: any) => {
  app.post(userAuthRoutes.Register, proxy.userAuth.register); 
  app.post(userAuthRoutes.Login, proxy.userAuth.login);
  app.get('/test', authService.authenticate('admin', 'read', 'product') ,proxy.userAuth.test); 
 
};

export default authRoute;
