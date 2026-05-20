import bcrypt from "bcryptjs";
import { pool } from "../../db";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from "../../config";

const loginUserIntoDB = async (payload: {
    email: string,
    password: string
}) => {
    const { email, password } = payload;
    // TODO 1. check if user exists - Done

    const userData = await pool.query(`
        SELECT * FROM users 
        WHERE email=$1
        `, [email])

    if (userData.rows[0] === 0) {
        throw new Error('Invalid credentials')
    }
    const user = userData.rows[0];

    // TODO 2. compare the password - Done
    const matchedPassword = await bcrypt.compare(password, user.password)
    if (!matchedPassword) {
        throw new Error('Invalid credentials')
    }

    // TODO 3. generated token - Done
    // Generate token

    const jwtPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        email: user.email,
    }
    const accessToken = jwt.sign(jwtPayload, config.secret as string, {
        expiresIn: "1d"
    })

    const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, {
        expiresIn: "1d"
    })

    return { accessToken, refreshToken }
}

const generatedRefreshToken = async (token: string) => {

    if (!token) {
        throw new Error("ForbiddenUnauthorized access!")
    }

    const decoded = jwt.verify(token as string, config.refresh_secret as string) as JwtPayload

    const userData = await pool.query(`
            SELECT * FROM users
            WHERE email=$1
            `, [decoded.email]);

    const user = userData.rows[0];

    if (userData.rows.length === 0) {
        throw new Error("User not found")
    }

    if (!user?.is_active) {
        throw new Error("Forbidden")
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        email: user.email,
    }
    const accessToken = jwt.sign(jwtPayload, config.secret as string, {
        expiresIn: "1d"
    })

    return { accessToken }
}

export const authService = {
    loginUserIntoDB,
    generatedRefreshToken
}