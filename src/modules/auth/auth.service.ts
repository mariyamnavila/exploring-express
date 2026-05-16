import bcrypt from "bcryptjs";
import { pool } from "../../db";
import jwt from 'jsonwebtoken';
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
        is_active: user.is_active,
        email: user.email
    }
    const accessToken = jwt.sign(jwtPayload, config.secret as string, {
        expiresIn: "1d"
    })

    return { accessToken }
}

export const authService = {
    loginUserIntoDB
}