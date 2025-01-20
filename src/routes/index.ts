// routes/index.ts
import { Application } from 'express';
import userRoutesSetup from './user';

const routes = async (app: Application) => {
    await userRoutesSetup(app);   // Set up user routes
    // await adminRoutesSetup(app);  //Set  up admin routes
};

export default routes;