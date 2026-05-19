import type { Request, Response } from "express";
import { userService } from "./user.service";

const createUser = async (req: Request, res: Response) => {
    // const { name, email, password, age } = req.body;
    try {

        const result = await userService.createUserIntoDB(req.body)

        res.status(201).json({
            message: "User created successfully",
            data: result.rows[0],
        })
    } catch (error: any) {
        res.status(500).json({
            message: error.message,
            error: error,
        })
    }
}

const getAllUser = async (req: Request, res: Response) => {
    console.log(req.user);
    try {
        const result = await userService.getAllUsersFromDB();
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.rows
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }
}

const getSingleUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await userService.getSingleUserFromDB(id as string)


        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: result.rows[0]
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }
}

const updateSingleUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    // const { name, password, age, is_active } = req.body

    try {
        const result = await userService.updateUserFromDB(req.body, id as string)

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: result.rows[0]
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }

}

const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const result = await userService.deleteUserFromDB(id as string)

        if (result.rowCount === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            })
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            data: {},
        })

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
            error: error
        })
    }
}

export const userController = {
    createUser,
    getAllUser,
    getSingleUser,
    updateSingleUser,
    deleteUser,
};