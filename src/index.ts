import app from "./app.js";
import { customError } from "./utils/error.js";
import { Request, Response, NextFunction } from "express";

const activePort = process.env.PORT;
app.listen(activePort, () => {
    console.log("server is listening on port: ", activePort);
});

app.use((err: customError, req: Request, res: Response, next: NextFunction) => { //for error handling
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
    res.status(statusCode).send({
        success: false,
        statusCode,
        message
    });
})