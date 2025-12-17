import User from '../models/user.js';
import mongoose from 'mongoose';
import { isUserVerified } from './verification.controller.js';

/**
 * Get user balance
 */
export const getBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('balance name email');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            balance: user.balance || 0,
            user: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Failed to get balance', details: error.message });
    }
};

/**
 * Top up / Add money to wallet
 * Yêu cầu: Tài khoản phải được xác minh
 */
export const topUp = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, paymentMethod, transactionId } = req.body;

        // Kiểm tra xác minh tài khoản
        const verified = await isUserVerified(userId);
        if (!verified) {
            return res.status(403).json({
                error: 'Bạn cần xác minh tài khoản trước khi nạp tiền',
                code: 'VERIFICATION_REQUIRED'
            });
        }

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (amount > 1000000) {
            return res.status(400).json({ error: 'Maximum top-up amount is $1,000,000' });
        }

        // Validate payment method
        const validMethods = ['bank_transfer', 'credit_card', 'paypal', 'crypto'];
        if (!paymentMethod || !validMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add to balance
        const previousBalance = user.balance || 0;
        user.balance = previousBalance + amount;
        await user.save();

        console.log(`💰 Top-up: User ${userId} added $${amount}. Balance: $${previousBalance} -> $${user.balance}`);

        res.status(200).json({
            message: 'Top-up successful',
            previousBalance: previousBalance,
            addedAmount: amount,
            newBalance: user.balance,
            paymentMethod: paymentMethod,
            transactionId: transactionId || `TXN_${Date.now()}`
        });
    } catch (error) {
        console.error('Error topping up:', error);
        res.status(500).json({ error: 'Failed to top up', details: error.message });
    }
};

/**
 * Withdraw money from wallet
 */
export const withdraw = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, withdrawMethod, accountDetails } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = user.balance || 0;
        if (amount > currentBalance) {
            return res.status(400).json({
                error: 'Insufficient balance',
                currentBalance: currentBalance,
                requestedAmount: amount
            });
        }

        // Deduct from balance
        user.balance = currentBalance - amount;
        await user.save();

        console.log(`💸 Withdraw: User ${userId} withdrew $${amount}. Balance: $${currentBalance} -> $${user.balance}`);

        res.status(200).json({
            message: 'Withdrawal successful',
            previousBalance: currentBalance,
            withdrawnAmount: amount,
            newBalance: user.balance
        });
    } catch (error) {
        console.error('Error withdrawing:', error);
        res.status(500).json({ error: 'Failed to withdraw', details: error.message });
    }
};

/**
 * Get transaction history (placeholder - would need Transaction model)
 */
export const getTransactionHistory = async (req, res) => {
    try {
        // For now, return empty array
        // In a real app, you'd have a Transaction model
        res.status(200).json({
            transactions: [],
            message: 'Transaction history feature coming soon'
        });
    } catch (error) {
        console.error('Error getting transaction history:', error);
        res.status(500).json({ error: 'Failed to get transaction history', details: error.message });
    }
};

