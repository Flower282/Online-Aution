import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'deducted', 'cancelled'],
        default: 'pending'
    },
    // Trạng thái:
    // - pending: chờ thanh toán
    // - paid: đã đặt cọc, đang chờ kết quả đấu giá
    // - refunded: đã hoàn tiền (người thua)
    // - deducted: đã trừ vào giá đấu giá (người thắng)
    // - cancelled: hủy bỏ
    
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'credit_card', 'paypal', 'wallet'],
        default: null
    },
    transactionId: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    refundedAt: {
        type: Date,
        default: null
    },
    deductedAt: {
        type: Date,
        default: null
    },
    // Thông tin hoàn tiền
    refundTransactionId: {
        type: String,
        default: null
    },
    // Ghi chú
    notes: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Index để tìm kiếm nhanh
depositSchema.index({ user: 1, product: 1 }, { unique: true });
depositSchema.index({ product: 1, status: 1 });
depositSchema.index({ user: 1, status: 1 });

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;

