import mongoose, { model, Model, Schema } from "mongoose";
import bcryptjs from 'bcryptjs'
import { IUser, IuserMethods, UserDocument } from '../types/user.types.js'

const UserSchema = new Schema<IUser, Model<UserDocument>, IuserMethods>({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please fill a valid email address"]
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
    },
    image: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    },
}, { timestamps: true }
)

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { //if password is not modified
        return next()
    }
    this.password = bcryptjs.hashSync(this.password, 10)
    next();
})

UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcryptjs.compare(enteredPassword, this.password);
};

const User = model<IUser, Model<UserDocument>>("User", UserSchema);

export default User