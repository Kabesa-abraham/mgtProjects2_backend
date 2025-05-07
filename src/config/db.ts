import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL as string);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connect MongoDB:', error);
        process.exit(1);
    }
}

export default connectDB