import { customError } from "../utils/error.js"

export const errorHandler = (statusCode: number, message: string) => {
    return new customError(statusCode, message);
}