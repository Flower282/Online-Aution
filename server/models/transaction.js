import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['topup', 'withdraw', 'deposit', 'refund', 'payment'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    // Payment gateway info
    paymentGateway: {
        type: String,
        enum: ['vnpay', 'momo', 'stripe', 'bank_transfer', 'wallet', null],
        default: null
    },
    paymentMethod: {
        type: String,
        default: null
    },
    // Gateway transaction IDs
    gatewayTransactionId: {
        type: String,
        default: null
    },
    gatewayOrderId: {
        type: String,
        default: null
    },
    // Idempotency key để tránh double charge
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    // Payment request info
    paymentUrl: {
        type: String,
        default: null
    },
    // Callback/Webhook data
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Security
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    // Related entities
    relatedAuction: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        default: null
    },
    relatedDeposit: {
        type: mongoose.Schema.ObjectId,
        ref: 'Deposit',
        default: null
    },
    // Notes
    notes: {
        type: String,
        default: null
    },
    // Timestamps
    completedAt: {
        type: Date,
        default: null
    },
    failedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Indexes for performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ gatewayTransactionId: 1 });
transactionSchema.index({ idempotencyKey: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;

