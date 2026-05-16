import { pool } from "../../db";

const createProfileIntoDB = async (payload: any) => {
    // console.log(payload);

    const { user_id, bio, address, phone, gender } = payload;

    // first check if user is exists

    const user = await pool.query(`
        SELECT * FROM users 
        WHERE id=$1
        `, [user_id])

    if (user.rows.length === 0) {
        throw new Error('User not exists!')
    }
    // console.log(user);

    const result = await pool.query(`
        INSERT INTO 
        profiles(user_id, bio, address, phone, gender) 
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
        `, [user_id, bio, address, phone, gender])

    return result
}

export const profileService = {
    createProfileIntoDB
}