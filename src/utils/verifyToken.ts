import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { errorHandler } from '../config/errorHandler.js';
import { Request, Response, NextFunction } from 'express';

interface JwtUserPayload {
    id: string;
}
declare module 'express-serve-static-core' {
    interface Request {
        user?: JwtUserPayload | JwtPayload;
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token_user;
    if (!token) {
        return next(errorHandler(401, 'Unauthorized'));
    }
    if (!process.env.ACCESS_TOKEN) {
        throw new Error('not found access token')
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err: VerifyErrors | null, user: JwtPayload | string | undefined) => {
        if (err) {
            return next(errorHandler(401, 'Unauthorized to do the action'))
        }
        req.user = user as JwtUserPayload;
        next();
    })
}