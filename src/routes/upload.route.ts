import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors'
import cloudinary from '../config/cloudinaryConfig.js';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();
router.use(cors());

const Storage = multer.diskStorage({});
const upload = multer({ storage: Storage })

router.post('/upload_image', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "uploads",
        });

        res.status(200).json({ image_url: result.secure_url });
    } catch (error) {
        next(error);
    }
}
);

export default router;
