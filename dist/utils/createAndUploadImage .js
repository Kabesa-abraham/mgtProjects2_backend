import fetch from "node-fetch";
import FormData from "form-data";
import { generateProfileImageBuffer } from "./generateProfileImg.js";
export const createAndUploadImage = async (firstname, lastname) => {
    try {
        const buffer = generateProfileImageBuffer(firstname, lastname);
        const form = new FormData();
        form.append("image", buffer, {
            filename: `${firstname}_${lastname}.png`,
            contentType: "image/png"
        });
        const res = await fetch("http://localhost:4000/backend/upload/upload_image", {
            method: "POST",
            body: form,
            headers: form.getHeaders()
        });
        if (!res.ok) {
            throw new Error('Error while fetching /upload_image');
        }
        if (res.ok) {
            const data = await res.json();
            return data.image_url;
        }
    }
    catch (err) {
        console.error("Error while fetching /upload_image :", err);
        throw err;
    }
};
