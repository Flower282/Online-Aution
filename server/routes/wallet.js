import express from 'express';
import {
    getBalance,
    topUp,
    withdraw,
    getTransactionHistory
} from '../controllers/wallet.controller.js';

const walletRouter = express.Router();

// Get current balance
walletRouter.get('/balance', getBalance);

// Top up / Add money
walletRouter.post('/topup', topUp);

// Withdraw money
walletRouter.post('/withdraw', withdraw);

// Get transaction history
walletRouter.get('/transactions', getTransactionHistory);

export default walletRouter;

