import express from 'express';
import {
    createAuction,
    showAuction,
    auctionById,
    placeBid,
    dashboardData,
    myAuction,
    deleteAuction,
    toggleLike,
    // Admin functions
    getAllAuctionsAdmin,
    // Deposit related
    getDepositInfo,
    submitDeposit,
    finalizeAuction,
    payForWonAuction,
    getWonAuctions
} from '../controllers/auction.controller.js';
import upload from '../middleware/multer.js';
import { validateUploadedImage } from '../middleware/imageValidation.js';
import { checkAdmin } from '../middleware/checkAdmin.js';
import { secureRoute } from '../middleware/auth.js';

const auctionRouter = express.Router();

// ==================== PUBLIC ROUTES (No Auth Required) ====================
// Note: These must come BEFORE /:id to avoid route conflicts

// Public: List all approved auctions
auctionRouter.get('/', showAuction);

// ==================== PROTECTED ROUTES (Auth Required) ====================
// Note: Specific routes must come BEFORE generic /:id route

// Stats & Dashboard (requires auth)
auctionRouter.get('/stats', secureRoute, dashboardData);

// Admin endpoints (requires auth + admin role)
auctionRouter.get('/admin/all', secureRoute, checkAdmin, getAllAuctionsAdmin);

// Won auctions (requires auth)
auctionRouter.get('/won', secureRoute, getWonAuctions);

// My auctions (requires auth)
auctionRouter.get("/myauction", secureRoute, myAuction);

// Create auction (requires auth)
// Validate image: magic bytes, dimensions, content
auctionRouter.post('/', secureRoute, upload.single('itemPhoto'), validateUploadedImage, createAuction);

// ==================== DYNAMIC ROUTES ====================

// Deposit endpoints (require auth) - must come before /:id
auctionRouter.get('/:id/deposit', secureRoute, getDepositInfo);
auctionRouter.post('/:id/deposit', secureRoute, submitDeposit);
auctionRouter.post('/:id/finalize', secureRoute, finalizeAuction);
auctionRouter.post('/:id/pay', secureRoute, payForWonAuction);

// Protected: View single auction details (requires auth)
auctionRouter.get('/:id', secureRoute, auctionById);

// Write operations on specific auction (require auth)
auctionRouter.post('/:id/like', secureRoute, toggleLike);
auctionRouter.post('/:id', secureRoute, placeBid);
auctionRouter.delete('/:id', secureRoute, checkAdmin, deleteAuction);


export default auctionRouter;