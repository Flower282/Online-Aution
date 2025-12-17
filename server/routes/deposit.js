import express from 'express';
import {
    checkDeposit,
    createDeposit,
    getMyDeposits,
    getAuctionDeposits
} from '../controllers/deposit.controller.js';
import { checkAdmin } from '../middleware/checkAdmin.js';

const depositRouter = express.Router();

// User endpoints
depositRouter
    // Get all my deposits
    .get('/my-deposits', getMyDeposits)

    // Check deposit status for a product
    .get('/:productId/check', checkDeposit)

    // Create/submit deposit for a product
    .post('/:productId', createDeposit);

// Admin endpoints
depositRouter
    // Get all deposits for a product (admin only)
    .get('/:productId/all', checkAdmin, getAuctionDeposits);

export default depositRouter;

