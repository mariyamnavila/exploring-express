import type { NextFunction, Request, Response } from "express";

// global error handling middleware
const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // console.log(err.stack);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    })
}

export default globalErrorHandler