import Deposit from '../models/deposit.js';
import Product from '../models/product.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

/**
 * Check if user has deposited for an auction
 * Returns deposit status and amount required
 */
export const checkDeposit = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Get deposit percentage with fallback for old products
        const depositPercentage = product.depositPercentage || 10; // Default 10%
        const depositRequired = product.depositRequired !== false; // Default true
        const startingPrice = product.startingPrice || 0;

        // Calculate deposit amount based on starting price
        const depositAmount = Math.round(
            (startingPrice * depositPercentage) / 100
        );

        console.log('💰 Deposit check:', {
            productId,
            startingPrice,
            depositPercentage,
            depositAmount,
            depositRequired
        });

        // Check if user already has a deposit for this product
        const existingDeposit = await Deposit.findOne({
            user: userId,
            product: productId,
            status: { $in: ['pending', 'paid'] }
        });

        res.status(200).json({
            hasDeposit: !!existingDeposit && existingDeposit.status === 'paid',
            depositRequired: depositRequired,
            depositPercentage: depositPercentage,
            depositAmount: depositAmount,
            startingPrice: product.startingPrice,
            deposit: existingDeposit ? {
                id: existingDeposit._id,
                amount: existingDeposit.amount,
                status: existingDeposit.status,
                paidAt: existingDeposit.paidAt
            } : null
        });
    } catch (error) {
        console.error('Error checking deposit:', error);
        res.status(500).json({ error: 'Failed to check deposit', details: error.message });
    }
};

/**
 * Create/Submit deposit for an auction
 * User must deposit before they can bid
 * Yêu cầu: Tài khoản phải được xác minh
 */
export const createDeposit = async (req, res) => {
    try {
        const { productId } = req.params;
        const { paymentMethod, transactionId } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Kiểm tra xác minh tài khoản
        const user = await User.findById(userId).select('verification.isVerified');
        if (!user?.verification?.isVerified) {
            return res.status(403).json({
                error: 'Bạn cần xác minh tài khoản trước khi đặt cọc',
                code: 'VERIFICATION_REQUIRED'
            });
        }

        // Validate payment method
        const validMethods = ['bank_transfer', 'cash', 'credit_card', 'paypal', 'wallet'];
        if (!paymentMethod || !validMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Check if auction is still active
        const now = new Date();
        if (new Date(product.itemEndDate) < now) {
            return res.status(400).json({ error: 'Auction has already ended' });
        }

        if (product.status !== 'approved') {
            return res.status(400).json({ error: 'Auction is not active' });
        }

        // Check if user is the seller
        if (product.seller.toString() === userId) {
            return res.status(400).json({ error: 'You cannot deposit on your own auction' });
        }

        // Check if user already has an active deposit
        const existingDeposit = await Deposit.findOne({
            user: userId,
            product: productId,
            status: { $in: ['paid'] }
        });

        if (existingDeposit) {
            return res.status(400).json({
                error: 'You already have an active deposit for this auction',
                deposit: {
                    id: existingDeposit._id,
                    amount: existingDeposit.amount,
                    status: existingDeposit.status,
                    paidAt: existingDeposit.paidAt
                }
            });
        }

        // Calculate deposit amount
        const depositAmount = Math.round(
            (product.startingPrice * product.depositPercentage) / 100
        );

        // Create or update deposit
        const deposit = await Deposit.findOneAndUpdate(
            { user: userId, product: productId },
            {
                user: userId,
                product: productId,
                amount: depositAmount,
                status: 'paid',
                paymentMethod: paymentMethod,
                transactionId: transactionId || null,
                paidAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            message: 'Deposit submitted successfully. You can now bid on this auction!',
            deposit: {
                id: deposit._id,
                amount: deposit.amount,
                status: deposit.status,
                paymentMethod: deposit.paymentMethod,
                paidAt: deposit.paidAt
            },
            canBid: true
        });
    } catch (error) {
        console.error('Error creating deposit:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'You already have a deposit for this auction'
            });
        }

        res.status(500).json({ error: 'Failed to create deposit', details: error.message });
    }
};

/**
 * Get all deposits for current user
 */
export const getMyDeposits = async (req, res) => {
    try {
        const userId = req.user.id;

        const deposits = await Deposit.find({ user: userId })
            .populate('product', 'itemName itemPhoto currentPrice startingPrice itemEndDate seller')
            .sort({ createdAt: -1 });

        // Calculate stats
        const stats = {
            total: deposits.length,
            paid: deposits.filter(d => d.status === 'paid').length,
            refunded: deposits.filter(d => d.status === 'refunded').length,
            deducted: deposits.filter(d => d.status === 'deducted').length,
            totalAmount: deposits.reduce((sum, d) => sum + d.amount, 0),
            refundedAmount: deposits
                .filter(d => d.status === 'refunded')
                .reduce((sum, d) => sum + d.amount, 0)
        };

        // Format deposits
        const formattedDeposits = deposits.map(d => ({
            id: d._id,
            amount: d.amount,
            status: d.status,
            paymentMethod: d.paymentMethod,
            transactionId: d.transactionId,
            paidAt: d.paidAt,
            refundedAt: d.refundedAt,
            deductedAt: d.deductedAt,
            product: d.product ? {
                id: d.product._id,
                itemName: d.product.itemName,
                itemPhoto: d.product.itemPhoto,
                currentPrice: d.product.currentPrice,
                startingPrice: d.product.startingPrice,
                itemEndDate: d.product.itemEndDate,
                isEnded: new Date(d.product.itemEndDate) < new Date()
            } : null,
            createdAt: d.createdAt
        }));

        res.status(200).json({
            stats,
            deposits: formattedDeposits
        });
    } catch (error) {
        console.error('Error getting deposits:', error);
        res.status(500).json({ error: 'Failed to get deposits', details: error.message });
    }
};

/**
 * Process deposits when auction ends
 * - Refund losers
 * - Deduct from winner's final price
 * Should be called by finalizeAuction or a cron job
 */
export const processAuctionDeposits = async (productId, winnerId) => {
    try {
        const now = new Date();

        // Get all paid deposits for this auction
        const deposits = await Deposit.find({
            product: productId,
            status: 'paid'
        });

        if (deposits.length === 0) {
            console.log(`No deposits to process for auction ${productId}`);
            return { refunded: 0, deducted: 0 };
        }

        let refunded = 0;
        let deducted = 0;

        for (const deposit of deposits) {
            if (winnerId && deposit.user.toString() === winnerId.toString()) {
                // Winner - deduct deposit from final price
                deposit.status = 'deducted';
                deposit.deductedAt = now;
                deposit.notes = 'Deposit deducted from final auction price';
                deducted++;
            } else {
                // Loser - refund deposit
                deposit.status = 'refunded';
                deposit.refundedAt = now;
                deposit.notes = 'Deposit refunded - auction lost';
                // TODO: Process actual refund via payment gateway
                refunded++;
            }
            await deposit.save();
        }

        console.log(`Processed deposits for auction ${productId}: ${refunded} refunded, ${deducted} deducted`);
        return { refunded, deducted };
    } catch (error) {
        console.error('Error processing auction deposits:', error);
        throw error;
    }
};

/**
 * Admin: Get all deposits for an auction
 */
export const getAuctionDeposits = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        const deposits = await Deposit.find({ product: productId })
            .populate('user', 'name email')
            .sort({ paidAt: -1 });

        // Calculate deposit amount
        const depositAmount = Math.round(
            (product.startingPrice * product.depositPercentage) / 100
        );

        res.status(200).json({
            productId: product._id,
            itemName: product.itemName,
            depositPercentage: product.depositPercentage,
            depositAmount: depositAmount,
            totalDeposits: deposits.length,
            deposits: deposits.map(d => ({
                id: d._id,
                user: d.user,
                amount: d.amount,
                status: d.status,
                paymentMethod: d.paymentMethod,
                paidAt: d.paidAt,
                refundedAt: d.refundedAt,
                deductedAt: d.deductedAt
            }))
        });
    } catch (error) {
        console.error('Error getting auction deposits:', error);
        res.status(500).json({ error: 'Failed to get auction deposits', details: error.message });
    }
};

/**
 * Check if user can bid (has valid deposit)
 * Returns true if deposit exists and is paid, or if deposit is not required
 */
export const canUserBid = async (userId, productId) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return { canBid: false, reason: 'Auction not found' };
        }

        // If deposit not required, allow bid
        if (!product.depositRequired) {
            return { canBid: true, reason: 'Deposit not required' };
        }

        // Check for valid deposit
        const deposit = await Deposit.findOne({
            user: userId,
            product: productId,
            status: 'paid'
        });

        if (deposit) {
            return { canBid: true, reason: 'Valid deposit found', depositId: deposit._id };
        }

        // Calculate required deposit
        const depositAmount = Math.round(
            (product.startingPrice * product.depositPercentage) / 100
        );

        return {
            canBid: false,
            reason: 'Deposit required before bidding',
            depositRequired: true,
            depositAmount: depositAmount,
            depositPercentage: product.depositPercentage
        };
    } catch (error) {
        console.error('Error checking if user can bid:', error);
        return { canBid: false, reason: 'Error checking deposit status' };
    }
};

