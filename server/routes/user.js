import express from 'express';
import { handleGetUser, handleChangePassword, getLoginHistory, getFavoriteAuctions, updateProfile } from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.get('/', handleGetUser);
userRouter.put('/profile', updateProfile);
userRouter.patch("/", handleChangePassword);
userRouter.get("/logins", getLoginHistory);
userRouter.get("/favorites", getFavoriteAuctions);

export default userRouter;