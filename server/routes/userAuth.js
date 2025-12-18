import express from "express";
import {
    handleUserSignup,
    handleUserLogin,
    handleUserLogout,
    handleRefreshToken,
    handleGetToken,
    requestPasswordReset,
    resetPassword,
} from "../controllers/userAuth.controller.js";
import { requestReactivation } from "../controllers/user.controller.js";
const userAuthRouter = express.Router();

userAuthRouter.post("/login", handleUserLogin);
userAuthRouter.post("/signup", handleUserSignup);
userAuthRouter.post("/logout", handleUserLogout);
userAuthRouter.post("/refresh-token", handleRefreshToken);
userAuthRouter.get("/token", handleGetToken); // Get access token for Socket.IO
userAuthRouter.post("/request-reactivation", requestReactivation); // Public endpoint for deactivated users

// Forgot password / reset password
userAuthRouter.post("/forgot-password", requestPasswordReset);
userAuthRouter.post("/reset-password", resetPassword);

export default userAuthRouter;