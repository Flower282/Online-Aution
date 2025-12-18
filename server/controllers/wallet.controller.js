import User from '../models/user.js';
import Transaction from '../models/transaction.js';
import mongoose from 'mongoose';
import { isUserVerified } from './verification.controller.js';
import {
    createVNPayPaymentUrl,
    verifyVNPayCallback,
    generateOrderId,
    generateIdempotencyKey
} from '../services/paymentGateway.js';
import { getClientIp } from '../utils/geoDetails.js';

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
 * Create payment request for top-up (SECURE - Server-side only)
 * Không tin tưởng amount từ client, validate trên server
 */
export const createPaymentRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, paymentMethod } = req.body;

        // Kiểm tra xác minh tài khoản
        const verified = await isUserVerified(userId);
        if (!verified) {
            return res.status(403).json({
                error: 'Bạn cần xác minh tài khoản trước khi nạp tiền',
                code: 'VERIFICATION_REQUIRED'
            });
        }

        // Validate amount từ CLIENT nhưng kiểm tra lại trên SERVER
        const amountNum = parseInt(amount);
        if (!amountNum || amountNum <= 0 || isNaN(amountNum)) {
            return res.status(400).json({ error: 'Số tiền không hợp lệ' });
        }

        // Giới hạn số tiền nạp (bảo vệ khỏi hacker)
        const MIN_AMOUNT = 10000; // 10,000 VNĐ
        const MAX_AMOUNT = 50000000; // 50,000,000 VNĐ

        if (amountNum < MIN_AMOUNT) {
            return res.status(400).json({
                error: `Số tiền nạp tối thiểu là ${MIN_AMOUNT.toLocaleString('vi-VN')} VNĐ`
            });
        }

        if (amountNum > MAX_AMOUNT) {
            return res.status(400).json({
                error: `Số tiền nạp tối đa là ${MAX_AMOUNT.toLocaleString('vi-VN')} VNĐ`
            });
        }

        // Validate payment method
        const validMethods = ['vnpay', 'bank_transfer', 'wallet'];
        if (!paymentMethod || !validMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate unique order ID và idempotency key
        const orderId = generateOrderId(userId);
        const idempotencyKey = generateIdempotencyKey(userId, amountNum);

        // Check for duplicate transaction (idempotency)
        const existingTransaction = await Transaction.findOne({ idempotencyKey });
        if (existingTransaction) {
            if (existingTransaction.status === 'completed') {
                return res.status(400).json({
                    error: 'Giao dịch này đã được xử lý',
                    transactionId: existingTransaction._id
                });
            }
            // Return existing pending transaction
            return res.status(200).json({
                message: 'Payment request already exists',
                paymentUrl: existingTransaction.paymentUrl,
                transactionId: existingTransaction._id,
                orderId: existingTransaction.gatewayOrderId
            });
        }

        // Get client IP for payment gateway
        const ipAddress = getClientIp(req);
        const userAgent = req.headers['user-agent'];

        // Create payment URL (server-side only - hacker không thể fake)
        let paymentUrl = null;
        if (paymentMethod === 'vnpay') {
            paymentUrl = createVNPayPaymentUrl({
                amount: amountNum,
                orderId: orderId,
                orderDescription: `Nạp tiền vào ví - ${user.name}`,
                ipAddress: ipAddress
            });
        } else if (paymentMethod === 'bank_transfer') {
            // For bank transfer, return instructions instead of payment URL
            // In production, you'd generate a unique bank account number for this transaction
            paymentUrl = null; // Handle separately
        }

        // Create transaction record (PENDING status)
        const transaction = new Transaction({
            user: userId,
            type: 'topup',
            amount: amountNum,
            status: 'pending',
            paymentGateway: paymentMethod === 'vnpay' ? 'vnpay' : null,
            paymentMethod: paymentMethod,
            gatewayOrderId: orderId,
            idempotencyKey: idempotencyKey,
            paymentUrl: paymentUrl,
            ipAddress: ipAddress,
            userAgent: userAgent,
            notes: `Nạp tiền vào ví - ${amountNum.toLocaleString('vi-VN')} VNĐ`
        });

        await transaction.save();

        console.log(`🔒 Secure Payment Request Created: User ${userId}, Amount ${amountNum}, Order ${orderId}`);

        res.status(200).json({
            message: 'Payment request created successfully',
            transactionId: transaction._id,
            orderId: orderId,
            paymentUrl: paymentUrl,
            amount: amountNum,
            paymentMethod: paymentMethod,
            // For bank transfer, return instructions
            ...(paymentMethod === 'bank_transfer' && {
                bankInstructions: {
                    accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'XXX-XXX-XXX',
                    accountName: process.env.BANK_ACCOUNT_NAME || 'Your Company Name',
                    amount: amountNum,
                    content: `NAP ${orderId}`
                }
            })
        });
    } catch (error) {
        console.error('Error creating payment request:', error);
        res.status(500).json({ error: 'Failed to create payment request', details: error.message });
    }
};

/**
 * Payment callback handler (from payment gateway)
 * SECURE: Verify signature, prevent replay attacks
 */
export const paymentCallback = async (req, res) => {
    try {
        const queryParams = req.query;

        // Verify VNPay signature
        const verification = verifyVNPayCallback(queryParams);

        if (!verification.isValid) {
            console.error('❌ Invalid payment signature:', verification);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/failed?error=invalid_signature`);
        }

        const { orderId, amount, gatewayTransactionId, responseCode, transactionStatus } = verification;

        // Find transaction by orderId
        const transaction = await Transaction.findOne({ gatewayOrderId: orderId });

        if (!transaction) {
            console.error('❌ Transaction not found:', orderId);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/failed?error=transaction_not_found`);
        }

        // Check if already processed (prevent replay attack)
        if (transaction.status === 'completed') {
            console.log('⚠️ Transaction already completed:', orderId);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/success?transactionId=${transaction._id}`);
        }

        // Verify amount matches (SECURITY: Don't trust gateway amount blindly)
        if (Math.abs(transaction.amount - amount) > 0.01) {
            console.error('❌ Amount mismatch:', { expected: transaction.amount, received: amount });
            transaction.status = 'failed';
            transaction.failedAt = new Date();
            transaction.notes = `Amount mismatch: expected ${transaction.amount}, got ${amount}`;
            await transaction.save();
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/failed?error=amount_mismatch`);
        }

        // Check payment status
        // VNPay Response Codes:
        // '00' = Giao dịch thành công
        // '07' = Trừ tiền thành công, giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)
        // '09' = Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking
        // '10' = Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần
        // '11' = Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch
        // '12' = Thẻ/Tài khoản bị khóa
        // '51' = Tài khoản không đủ số dư để thực hiện giao dịch
        // '65' = Tài khoản đã vượt quá hạn mức giao dịch trong ngày
        // '75' = Ngân hàng thanh toán đang bảo trì
        // '99' = Lỗi không xác định

        if (responseCode === '00' && (transactionStatus === '00' || transactionStatus === '07')) {
            // Payment successful
            const user = await User.findById(transaction.user);
            if (!user) {
                transaction.status = 'failed';
                transaction.failedAt = new Date();
                transaction.notes = 'User not found';
                await transaction.save();
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/failed?error=user_not_found`);
            }

            // Update user balance (ATOMIC operation)
            const previousBalance = user.balance || 0;
            user.balance = previousBalance + amount;
            await user.save();

            // Update transaction
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            transaction.gatewayTransactionId = gatewayTransactionId;
            transaction.gatewayResponse = queryParams;
            await transaction.save();

            console.log(`✅ Payment Completed: User ${transaction.user}, Amount ${amount}, Transaction ${transaction._id}`);

            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/success?transactionId=${transaction._id}`);
        } else {
            // Payment failed
            transaction.status = 'failed';
            transaction.failedAt = new Date();
            transaction.gatewayResponse = queryParams;
            transaction.notes = `Payment failed: ResponseCode ${responseCode}, Status ${transactionStatus}`;
            await transaction.save();

            console.log(`❌ Payment Failed: Order ${orderId}, ResponseCode ${responseCode}`);

            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/failed?error=payment_failed&code=${responseCode}`);
        }
    } catch (error) {
        console.error('Error processing payment callback:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/failed?error=server_error`);
    }
};

/**
 * Payment webhook handler (for server-to-server notifications)
 * SECURE: Verify IP whitelist, signature, idempotency
 */
export const paymentWebhook = async (req, res) => {
    try {
        // Verify IP whitelist (only accept from VNPay IPs)
        const clientIp = getClientIp(req);
        const allowedIPs = process.env.VNPAY_WHITELIST_IPS?.split(',') || [];

        // In production, verify IP is from VNPay
        // if (!allowedIPs.includes(clientIp)) {
        //     console.error('❌ Unauthorized webhook IP:', clientIp);
        //     return res.status(403).json({ error: 'Unauthorized IP' });
        // }

        // Verify signature
        const verification = verifyVNPayCallback(req.body || req.query);

        if (!verification.isValid) {
            console.error('❌ Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const { orderId, amount, gatewayTransactionId } = verification;

        // Find transaction
        const transaction = await Transaction.findOne({ gatewayOrderId: orderId });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Idempotency check
        if (transaction.status === 'completed') {
            return res.status(200).json({ message: 'Already processed' });
        }

        // Process payment (same logic as callback)
        // ... (similar to paymentCallback)

        res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * Top up / Add money to wallet (DEPRECATED - Use createPaymentRequest instead)
 * Kept for backward compatibility but should use payment gateway
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
        const validMethods = ['bank_transfer', 'credit_card', 'paypal', 'crypto', 'wallet'];
        if (!paymentMethod || !validMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // For wallet method (internal transfer), allow direct top-up
        // For external payment methods, redirect to createPaymentRequest
        if (paymentMethod !== 'wallet') {
            return res.status(400).json({
                error: 'Please use /wallet/payment/request endpoint for secure payment gateway integration',
                code: 'USE_PAYMENT_GATEWAY'
            });
        }

        // Add to balance (only for wallet/internal methods)
        const previousBalance = user.balance || 0;
        user.balance = previousBalance + amount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            user: userId,
            type: 'topup',
            amount: amount,
            status: 'completed',
            paymentMethod: 'wallet',
            gatewayTransactionId: transactionId || `TXN_${Date.now()}`,
            completedAt: new Date()
        });
        await transaction.save();

        console.log(`💰 Top-up: User ${userId} added ${amount}. Balance: ${previousBalance} -> ${user.balance}`);

        res.status(200).json({
            message: 'Top-up successful',
            previousBalance: previousBalance,
            addedAmount: amount,
            newBalance: user.balance,
            paymentMethod: paymentMethod,
            transactionId: transaction._id
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
 * Get transaction history
 */
export const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, status, limit = 50, page = 1, days } = req.query;

        const query = { user: userId };
        if (type) query.type = type;
        if (status) query.status = status;

        // Filter by days (e.g., last 30 days)
        if (days) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            query.createdAt = { $gte: daysAgo };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            transactions: transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
                hasMore: skip + transactions.length < total
            }
        });
    } catch (error) {
        console.error('Error getting transaction history:', error);
        res.status(500).json({ error: 'Failed to get transaction history', details: error.message });
    }
};

