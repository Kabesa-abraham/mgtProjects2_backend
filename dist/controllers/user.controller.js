import { errorHandler } from "../config/errorHandler.js";
import jwt from 'jsonwebtoken';
import User from "../models/user.model.js";
import { createAndUploadImage } from "../utils/createAndUploadImage .js";
import bcryptjs from 'bcryptjs';
export const createUser = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return next(errorHandler(400, "You must fill in all fields."));
    }
    try {
        //check if user exist in database
        const checkUser = await User.findOne({ email });
        if (checkUser) {
            return next(errorHandler(400, 'This email is already registered.'));
        }
        //check if password is at least 6 characters
        if (password.length < 6) {
            return next(errorHandler(400, 'Password must be at least 6 characters long.'));
        }
        //generate a default image
        const image = await createAndUploadImage(firstName, lastName);
        const user = new User({
            firstName, lastName, email, password, image: image
        });
        await user.save(); //save user
        //create json web token
        const access_token = process.env.ACCESS_TOKEN;
        if (!access_token) {
            throw new Error('not found access token');
        }
        const payload = { id: user._id };
        const token = jwt.sign(payload, access_token, { expiresIn: '1d' });
        //Rechercher le user
        const userSaved = await User.findOne({ email }).lean();
        if (userSaved) {
            const { password, ...rest } = userSaved;
            res.status(200).cookie('token_user', token, {
                httpOnly: true,
                maxAge: 1 * 24 * 60 * 60 * 1000, //1day
                secure: process.env.NODE_ENV === 'production', //if in production, use HTTPS
                sameSite: 'none', // allow cookies in cross-origin requests
            }).json(rest);
        }
    }
    catch (error) {
        next(error);
    }
};
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(errorHandler(400, "You must fill in all fields."));
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return next(errorHandler(404, "user not found!"));
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return next(errorHandler(400, "Invalid password!"));
        }
        const access_token = process.env.ACCESS_TOKEN;
        if (!access_token) {
            throw new Error('not found access token');
        }
        const payload = { id: user._id };
        const token = jwt.sign(payload, access_token, { expiresIn: '1d' });
        //search le user
        const userSaved = await User.findOne({ email }).lean();
        if (userSaved) {
            const { password, ...rest } = userSaved;
            res.status(200).cookie('token_user', token, {
                httpOnly: true,
                maxAge: 1 * 24 * 60 * 60 * 1000, //1day
                secure: process.env.NODE_ENV === 'production', //if in production, use HTTPS
                sameSite: 'none', // allow cookies in cross-origin requests
            }).json(rest);
        }
    }
    catch (error) {
        next(error);
    }
};
export const deleteUser = async (req, res, next) => {
    if (req.user) {
        if (req.user.id !== req.params.userId) {
            return next(errorHandler(401, 'Unauthorized to delete this account!'));
        }
    }
    const { password } = req.body;
    try {
        const user = await User.findById({ _id: req.params.userId });
        if (!user) {
            return next(errorHandler(401, 'Unauthorized to delete this account!'));
        }
        else {
            if (password === "") {
                return next(errorHandler(401, 'please, fill the password field to confirm that it\'is your account'));
            }
            const isMatch = await user.matchPassword(password);
            //matchPassword is a method l have created in user.route.ts
            if (!isMatch) {
                return next(errorHandler(401, 'password is incorrect'));
            }
            await User.findByIdAndDelete(req.params.userId);
            res.status(200).clearCookie('token_user', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none'
            }).json('User has been deleted successfuly');
        }
    }
    catch (error) {
        next(error);
    }
};
export const logoutUser = async (req, res, next) => {
    res.status(200).clearCookie('token_user', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none'
    }).json('User has been logged out successfuly');
};
export const getAllUsers = async (req, res, next) => {
    try {
        const rawStart = req.query.startIndex;
        const startIndex = typeof rawStart === 'string' && !isNaN(Number(rawStart))
            ? parseInt(rawStart, 10)
            : 0;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;
        const users = await User.find({
            ...(req.query.userId && { _id: req.query.userId }),
            ...(req.query.searchTerm && {
                $or: [
                    { firstName: { $regex: req.query.searchTerm, $options: 'i' } },
                    { lastName: { $regex: req.query.searchTerm, $options: 'i' } },
                    { email: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        }).sort({ updatedAt: sortDirection }).skip(startIndex);
        res.status(200).json(users);
    }
    catch (error) {
        next(error);
    }
};
export const updateUser = async (req, res, next) => {
    const { firstName, lastName, email, password, image } = req.body;
    if (req.user) {
        if (req.user.id !== req.params.userId) {
            return next(errorHandler(401, 'Unauthorized to update this account!'));
        }
    }
    let hashPassword;
    try {
        if (password) {
            if (password.length < 6) {
                return next(errorHandler(400, 'Password must be at least 6 characters long.'));
            }
            hashPassword = bcryptjs.hashSync(password, 10);
        }
        await User.findByIdAndUpdate(req.params.userId, {
            $set: {
                firstName,
                lastName,
                email,
                password: hashPassword,
                image: image
            },
        }, { new: true });
        //search user
        const userSaved = await User.findOne({ _id: req.params.userId }).lean();
        if (userSaved) {
            const { password, ...rest } = userSaved;
            res.status(200).json(rest);
        }
    }
    catch (error) {
        next(error);
    }
};
export const AuthWithGoogle = async (req, res, next) => {
    const { firstName, lastName, email, image } = req.body;
    console.log('le corp de la requête', req.body);
    try {
        const user = await User.findOne({ email }).lean();
        if (user) { //if user exist we just logged in
            const access_token = process.env.ACCESS_TOKEN;
            if (!access_token) {
                throw new Error('not found access token');
            }
            const payload = { id: user._id };
            const token = jwt.sign(payload, access_token, { expiresIn: '1d' });
            const { password, ...rest } = user;
            res.status(200).cookie('token_user', token, {
                httpOnly: true,
                maxAge: 1 * 24 * 60 * 60 * 1000, //1day
                secure: process.env.NODE_ENV === 'production', //if in production, use HTTPS
                sameSite: 'none', // allow cookies in cross-origin requests
            }).json(rest);
        }
        if (!user) {
            const generatedPassword = Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8); //va géneré un mot de passe qui va contenir des lettres et nombres et on ne prendra que les 8last codes
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
            const newUser = new User({
                firstName: firstName.toLowerCase().split(" ").join(""),
                lastName: lastName.toLowerCase().split(" ").join(""),
                email: email,
                password: hashedPassword,
                image: image,
            });
            const user = await newUser.save();
            //create json web token
            const access_token = process.env.ACCESS_TOKEN;
            if (!access_token) {
                throw new Error('not found access token');
            }
            const payload = { id: user._id };
            const token = jwt.sign(payload, access_token, { expiresIn: '1d' });
            //search le user
            const userSaved = await User.findOne({ email }).lean();
            if (userSaved) {
                const { password, ...rest } = userSaved;
                res.status(200).cookie('token_user', token, {
                    httpOnly: true,
                    maxAge: 1 * 24 * 60 * 60 * 1000, //1day
                    secure: process.env.NODE_ENV === 'production', //if in production, use HTTPS
                    sameSite: 'none', // allow cookies in cross-origin requests
                }).json(rest);
            }
        }
    }
    catch (error) {
        next(error);
    }
};
