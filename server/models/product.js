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
