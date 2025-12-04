import express from "express";
import { checkAdmin } from "../middleware/checkAdmin.js";
import { getAdminDashboard, getAllUsers, deleteUserById, reactivateUser, migrateUsersIsActive } from "../controllers/admin.controller.js";
const adminRouter = express.Router();

adminRouter.get('/dashboard', checkAdmin, getAdminDashboard);
adminRouter.get('/users', checkAdmin, getAllUsers);
adminRouter.delete('/users/:userId', checkAdmin, deleteUserById); // Deactivate user
adminRouter.patch('/users/:userId/reactivate', checkAdmin, reactivateUser); // Reactivate user
adminRouter.post('/migrate-users-isactive', checkAdmin, migrateUsersIsActive); // Migration: Add isActive to all users

export default adminRouter;