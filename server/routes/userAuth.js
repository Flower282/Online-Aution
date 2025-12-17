import express from "express";
import { handleUserSignup, handleUserLogin, handleUserLogout, handleRefreshToken, handleGetToken } from "../controllers/userAuth.controller.js";
import { requestReactivation } from "../controllers/user.controller.js";
const userAuthRouter = express.Router();

userAuthRouter.post("/login", handleUserLogin);
userAuthRouter.post("/signup", handleUserSignup);
userAuthRouter.post("/logout", handleUserLogout);
userAuthRouter.post("/refresh-token", handleRefreshToken);
userAuthRouter.get("/token", handleGetToken); // Get access token for Socket.IO
userAuthRouter.post("/request-reactivation", requestReactivation); // Public endpoint for deactivated users

export default userAuthRouter;