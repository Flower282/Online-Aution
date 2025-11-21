import express from "express";
import { checkAdmin } from "../middleware/checkAdmin.js";
import { getAdminDashboard, getAllUsers, deleteUserById } from "../controllers/admin.controller.js";
const adminRouter = express.Router();

adminRouter.get('/dashboard', checkAdmin, getAdminDashboard);
adminRouter.get('/users', checkAdmin, getAllUsers);
adminRouter.delete('/users/:userId', checkAdmin, deleteUserById);

export default adminRouter;