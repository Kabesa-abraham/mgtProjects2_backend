import { createCanvas } from "canvas";

export const generateProfileImageBuffer = (firstname: string, lastname: string): Buffer => {
    const width = 256;
    const height = 256;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgb(41, 114, 209)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = `${firstname[0] ?? ""}${lastname[0] ?? ""}`.toUpperCase();
    ctx.fillText(initials, width / 2, height / 2);

    return canvas.toBuffer("image/png");
};
