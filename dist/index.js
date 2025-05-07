import app from "./app.js";
const activePort = process.env.PORT;
app.listen(activePort, () => {
    console.log("server is listening on port: ", activePort);
});
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
    res.status(statusCode).send({
        success: false,
        statusCode,
        message
    });
});
