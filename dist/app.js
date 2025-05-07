import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import useRoutes from './routes/user.route.js';
import uploadRoutes from './routes/upload.route.js';
import projectRoutes from './routes/project.route.js';
import taskRoutes from './routes/task.route.js';
import cookieParser from 'cookie-parser';
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/backend/auth', useRoutes);
app.use('/backend/upload', uploadRoutes);
app.use('/backend/project', projectRoutes);
app.use('/backend/task', taskRoutes);
export default app;
