import type { Response } from "express";

type TResponse<T> = {
    status: number;
    success: boolean;
    message: string;
    data?: T;
    error?: any;
}

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
    const { status, success, message, data: result, error } = data

    res.status(status).json({
        success: success,
        message: message,
        data: result,
        error: error
    })

}

export default sendResponse;