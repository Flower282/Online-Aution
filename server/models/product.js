import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    bidder: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    bidAmount: { type: Number, required: true },
    bidTime: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true,
    },
    itemDescription: {
        type: String,
        required: true,
    },
    itemCategory: {
        type: String,
        required: true,
    },
    itemPhoto: {
        type: String,
    },
    startingPrice: {
        type: Number,
        required: true,
    },
    currentPrice: {
        type: Number,
        default: 0,
    },
    itemStartDate: {
        type: Date,
        default: Date.now,
    },
    itemEndDate: {
        type: Date,
        required: true,
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    bids: [bidSchema],
    winner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    isSold: {
        type: Boolean,
        default: false,
    },
    // Deposit (Đặt cọc) fields
    // depositRequired: user phải đặt cọc trước khi bid
    // depositPercentage: % của giá khởi điểm
    // depositAmount: số tiền cọc = startingPrice * depositPercentage / 100
    depositRequired: {
        type: Boolean,
        default: true,
    },
    depositPercentage: {
        type: Number,
        default: 10, // 10% của giá khởi điểm
        min: 0,
        max: 100
    },
    // Auction completion status
    auctionStatus: {
        type: String,
        enum: ['active', 'ended', 'completed', 'cancelled', 'expired'],
        default: 'active'
    },
    /**
     * Payment info for winner after auction ends
     * - paymentDeadline: hạn cuối để người thắng thanh toán (mặc định 1 tuần sau khi phiên kết thúc)
     * - paymentStatus:
     *   - pending: đã có winner, đang chờ thanh toán
     *   - paid: người thắng đã thanh toán đủ
     *   - expired: quá hạn thanh toán, phiên có thể bị hủy
     * - finalPrice: giá cuối cùng đã đấu giá (fix lại để không phụ thuộc currentPrice nếu sau này thay đổi)
     * - platformCommissionPercentage: % phí sàn theo quy định đấu giá quốc tế
     * - platformCommissionAmount: số tiền phí sàn
     * - sellerAmount: số tiền thực tế người đăng sản phẩm nhận được
     * - paymentCompletedAt: thời điểm hoàn tất thanh toán
     */
    paymentDeadline: {
        type: Date,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'expired'],
        default: 'pending'
    },
    finalPrice: {
        type: Number,
        default: 0
    },
    platformCommissionPercentage: {
        type: Number,
        default: 10, // 10% phí sàn (có thể chỉnh theo quy định đấu giá quốc tế)
        min: 0,
        max: 100
    },
    platformCommissionAmount: {
        type: Number,
        default: 0
    },
    sellerAmount: {
        type: Number,
        default: 0
    },
    paymentCompletedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: true
    },
    rejectionReason: {
        type: String,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
