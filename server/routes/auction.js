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
    getWonAuctions
} from '../controllers/auction.controller.js';
import upload from '../middleware/multer.js';
import { checkAdmin } from '../middleware/checkAdmin.js';

const auctionRouter = express.Router();

// Stats & Dashboard
auctionRouter
    .get('/stats', dashboardData)

// Admin endpoints
auctionRouter
    .get('/admin/all', checkAdmin, getAllAuctionsAdmin)

// Won auctions (auctions user has won)
auctionRouter
    .get('/won', getWonAuctions)

// List & Create auctions
auctionRouter
    .get('/', showAuction)
    .post('/', upload.single('itemPhoto'), createAuction);

// My auctions (auctions user created)
auctionRouter
    .get("/myauction", myAuction)

// Deposit endpoints (must come before /:id to avoid route conflicts)
auctionRouter
    .get('/:id/deposit', getDepositInfo)         // Get deposit info
    .post('/:id/deposit', submitDeposit)         // Submit deposit payment
    .post('/:id/finalize', finalizeAuction)      // Finalize auction (admin/system)

// Auction specific operations
auctionRouter
    .get('/:id', auctionById)
    .post('/:id/like', toggleLike)               // Like/unlike auction
    .post('/:id', placeBid)                      // Place bid
    .delete('/:id', checkAdmin, deleteAuction)   // Delete auction (admin only)


export default auctionRouter;