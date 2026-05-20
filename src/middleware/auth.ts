import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from "../config";
import { pool } from "../db";
import type { ROLES } from "../types";


const auth = (...roles: ROLES[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            // Todo 1. check if the token exists
            // Todo 2. verify token       
            // Todo 3. find the user into database       
            // Todo 4. if the user active or not       

            const token = req.headers.authorization;

            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized access!"
                })
            }

            const decoded = jwt.verify(token as string, config.secret as string) as JwtPayload

            const userData = await pool.query(`
            SELECT * FROM users
            WHERE email=$1
            `, [decoded.email])

            // console.log(userData);

            const user = userData.rows[0];

            if (userData.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                })
            }

            if (!user?.is_active) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden!!"
                })
            }

            if (roles.length && !roles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden!!, this role have no access"
                })
            }

            req.user = decoded

            next()

        } catch (error) {
            next(error)
        }
    }
}

export default auth;