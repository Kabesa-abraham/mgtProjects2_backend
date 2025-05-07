import jwt from 'jsonwebtoken';
import { errorHandler } from '../config/errorHandler.js';
export const verifyToken = (req, res, next) => {
    const token = req.cookies.token_user;
    if (!token) {
        return next(errorHandler(401, 'Unauthorized'));
    }
    if (!process.env.ACCESS_TOKEN) {
        throw new Error('not found access token');
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) {
            return next(errorHandler(401, 'Unauthorized to do the action'));
        }
        req.user = user;
        next();
    });
};
