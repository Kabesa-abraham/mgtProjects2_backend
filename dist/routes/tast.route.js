import express from 'express';
import { verifyToken } from '../utils/verifyToken.js';
import { createTask, updateTask, deleteTask, getAllTask } from '../controllers/task.controller.js';
const router = express.Router();
router.post('/createTask', verifyToken, createTask);
router.put('/updateTask/:taskId', verifyToken, updateTask);
router.delete('/deleteTask/:taskId', verifyToken, deleteTask);
router.get('/getAllTask', verifyToken, getAllTask);
export default router;
