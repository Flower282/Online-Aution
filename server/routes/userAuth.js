import express from "express";
import { handleUserSignup, handleUserLogin, handleUserLogout, handleRefreshToken, handleGetToken } from "../controllers/userAuth.controller.js";
const userAuthRouter = express.Router();

userAuthRouter.post("/login", handleUserLogin);
userAuthRouter.post("/signup", handleUserSignup);
userAuthRouter.post("/logout", handleUserLogout);
userAuthRouter.post("/refresh-token", handleRefreshToken);
userAuthRouter.get("/token", handleGetToken); // Get access token for Socket.IO

export default userAuthRouter;