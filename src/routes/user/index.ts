import { Application } from 'express';
import userAuthRoutes from './auth';
import userRoutes from './user';

const userRoutesSetup = async (app: Application) => {
    userAuthRoutes(app);
    userRoutes(app)
};
export default userRoutesSetup;
