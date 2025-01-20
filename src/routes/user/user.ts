import proxy from '../../services/appServiceProxy';
import { userRoutes } from '../../helper/routes';

const userRoute = async (app: any) => {
  // app.get(userRoutes.Profile, proxy.userAuth.profile); 
};

export default userRoute;
