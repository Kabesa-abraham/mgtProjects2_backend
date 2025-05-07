import { customError } from "../utils/error.js";
export const errorHandler = (statusCode, message) => {
    return new customError(statusCode, message);
};
