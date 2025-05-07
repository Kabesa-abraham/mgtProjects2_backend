import express from "express";
import { createUser, loginUser, deleteUser, logoutUser, getAllUsers, updateUser, AuthWithGoogle } from '../controllers/user.controller.js'
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

router.post('/signup', createUser);
router.post('/signin', loginUser);
router.post('/logout', verifyToken, logoutUser);

router.get('/allUser', verifyToken, getAllUsers);

router.delete('/deleteUser/:userId', verifyToken, deleteUser);

router.put('/updateUser/:userId', verifyToken, updateUser);

router.post('/googleAuth', AuthWithGoogle);

export default router;