import { Router, type NextFunction, type Request, type Response } from "express";
import { userController } from "./user.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router()

router.post('/', userController.createUser)
router.get('/', auth(USER_ROLE.admin, USER_ROLE.agent), userController.getAllUser)
router.get('/:id', userController.getSingleUser)
router.put('/:id', userController.updateSingleUser)
router.delete('/:id', userController.deleteUser)

export const userRoute = router;