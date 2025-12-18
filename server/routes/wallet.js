import express from 'express';
import {
    getBalance,
    topUp,
    withdraw,
    getTransactionHistory,
    createPaymentRequest,
    paymentCallback,
    paymentWebhook
} from '../controllers/wallet.controller.js';
import { secureRoute } from '../middleware/auth.js';

const walletRouter = express.Router();

// Get current balance (requires auth)
walletRouter.get('/balance', secureRoute, getBalance);

// Create secure payment request for top-up (requires auth)
walletRouter.post('/payment/request', secureRoute, createPaymentRequest);

// Payment callback from gateway (public - called by payment gateway)
walletRouter.get('/payment/callback', paymentCallback);
walletRouter.post('/payment/callback', paymentCallback);

// Payment webhook from gateway (public - called by payment gateway server-to-server)
walletRouter.post('/payment/webhook', paymentWebhook);

// Top up / Add money (DEPRECATED - use /payment/request instead)
walletRouter.post('/topup', secureRoute, topUp);

// Withdraw money (requires auth)
walletRouter.post('/withdraw', secureRoute, withdraw);

// Get transaction history (requires auth)
walletRouter.get('/transactions', secureRoute, getTransactionHistory);

export default walletRouter;

