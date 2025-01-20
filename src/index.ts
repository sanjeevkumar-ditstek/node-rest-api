import { Server } from './server';
import dotenv from 'dotenv';
import { connectToMongo } from './db/config';

dotenv.config();
const Port = process.env.PORT || 3001;
const server = new Server(Number(Port));
server.start();
connectToMongo();
