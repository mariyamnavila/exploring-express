import { pool } from "../../db";
import type { IProfile } from "./profile.interface";

const createProfileIntoDB = async (payload: any) => {

    const { user_id, bio, address, phone, gender } = payload;

    // first check if user is exists

    const user = await pool.query(`
        SELECT * FROM users 
        WHERE id=$1
        `, [user_id])

    if (user.rows.length === 0) {
        throw new Error('User not exists!')
    }

    const result = await pool.query(`
        INSERT INTO 
        profiles(user_id, bio, address, phone, gender) 
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
        `, [user_id, bio, address, phone, gender])

    return result
}

const getAllProfilesFromDB = async () => {
    const profiles = await pool.query(`
        SELECT * FROM profiles
        `)

    return profiles
}

const getSingleProfileFromDB = async (id: string) => {
    const profile = await pool.query(`
        SELECT * FROM profiles
        WHERE id = $1
        `, [id])

    return profile
}

const updateProfileFromDB = async (payload: IProfile, id: string) => {
    const { bio, address, gender, phone } = payload

    const updatedProfile = await pool.query(`
        UPDATE profiles
        SET bio = COALESCE($1,bio),
            address = COALESCE($2,address),
            gender = COALESCE($3,gender),
            phone = COALESCE($4,phone),
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
        `, [bio, address, gender, phone, id])

    return updatedProfile
}

const deleteProfileFromDB = async (id: string) => {
    const result = await pool.query(`
        DELETE FROM profiles
        WHERE id = $1
        `, [id])

    return result
}

export const profileService = {
    createProfileIntoDB,
    getAllProfilesFromDB,
    getSingleProfileFromDB,
    updateProfileFromDB,
    deleteProfileFromDB,
}