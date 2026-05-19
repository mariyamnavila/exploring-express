import { Router, type NextFunction, type Request, type Response } from "express";
import { userController } from "./user.controller";
import auth from "../../middleware/auth";

const router = Router()

router.post('/', userController.createUser)
router.get('/', auth(), userController.getAllUser)
router.get('/:id', userController.getSingleUser)
router.put('/:id', userController.updateSingleUser)
router.delete('/:id', userController.deleteUser)

export const userRoute = router;