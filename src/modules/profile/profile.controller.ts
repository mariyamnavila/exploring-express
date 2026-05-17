import type { Request, Response } from "express";
import { profileService } from "./profile.service";

const createProfile = async (req: Request, res: Response) => {
    try {
        const result = await profileService.createProfileIntoDB(req.body)

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: result.rows[0],
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }
}

const getAllProfiles = async (req: Request, res: Response) => {
    try {

        const result = await profileService.getAllProfilesFromDB();
        res.status(200).json({
            success: true,
            message: 'All profiles retrieved successfully',
            data: result.rows,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error
        })
    }
}

const getSingleProfile = async (req: Request, res: Response) => {
    try {

        const { id } = req.params
        const result = await profileService.getSingleProfileFromDB(id as string)

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Profile not found!",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: result.rows[0]
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error,
        })
    }
}

const updateProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const payload = req.body;
        const result = await profileService.updateProfileFromDB(payload, id as string)

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Profile not found!",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: result.rows[0]
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error,
        })
    }
}

const deleteProfile = async (req: Request, res: Response) => {
    try {

        const { id } = req.params;

        const result = await profileService.deleteProfileFromDB(id as string);

        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "Profile not found!",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "Profile deleted successfully",
            data: {}
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error,
        })
    }
}

export const profileController = {
    createProfile,
    getAllProfiles,
    getSingleProfile,
    updateProfile,
    deleteProfile,
};