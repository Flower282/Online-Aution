import express from "express";
import { checkAdmin } from "../middleware/checkAdmin.js";
import {
    getAdminDashboard,
    getAllUsers,
    deleteUserById,
    reactivateUser,
    migrateUsersIsActive,
    getPendingAuctions,
    approveAuction,
    rejectAuction,
    getAllAuctions
} from "../controllers/admin.controller.js";
const adminRouter = express.Router();

// User Management
adminRouter.get('/dashboard', checkAdmin, getAdminDashboard);
adminRouter.get('/users', checkAdmin, getAllUsers);
adminRouter.delete('/users/:userId', checkAdmin, deleteUserById); // Deactivate user
adminRouter.patch('/users/:userId/reactivate', checkAdmin, reactivateUser); // Reactivate user
adminRouter.post('/migrate-users-isactive', checkAdmin, migrateUsersIsActive); // Migration: Add isActive to all users

// Auction Management
adminRouter.get('/auctions/pending', checkAdmin, getPendingAuctions); // Get pending auctions
adminRouter.get('/auctions', checkAdmin, getAllAuctions); // Get all auctions with filters
adminRouter.patch('/auctions/:auctionId/approve', checkAdmin, approveAuction); // Approve auction
adminRouter.patch('/auctions/:auctionId/reject', checkAdmin, rejectAuction); // Reject auction

export default adminRouter;