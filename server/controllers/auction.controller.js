import uploadImage from '../services/cloudinaryService.js';
import Product from '../models/product.js';
import User from '../models/user.js';
import mongoose from "mongoose";
import { processAuctionDeposits } from './deposit.controller.js';


export const createAuction = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || !req.user.id) {
            console.error('❌ Create auction: User not authenticated');
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { itemName, startingPrice, itemDescription, itemCategory, itemStartDate, itemEndDate } = req.body;

        // Validate required fields
        if (!itemName || !startingPrice || !itemDescription || !itemCategory || !itemStartDate || !itemEndDate) {
            console.error('❌ Create auction: Missing required fields', {
                itemName: !!itemName,
                startingPrice: !!startingPrice,
                itemDescription: !!itemDescription,
                itemCategory: !!itemCategory,
                itemStartDate: !!itemStartDate,
                itemEndDate: !!itemEndDate
            });
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate image
        if (!req.file) {
            console.error('❌ Create auction: No image file provided');
            return res.status(400).json({ message: 'Item photo is required' });
        }

        let imageUrl = '';

        try {
            console.log('📤 Uploading image to Cloudinary...');
            imageUrl = await uploadImage(req.file);
            console.log('✅ Image uploaded successfully:', imageUrl);

            // ✅ Tự động xóa file tạm sau khi upload thành công
            try {
                const fs = await import('fs');
                if (req.file && req.file.path) {
                    fs.unlinkSync(req.file.path);
                    console.log('🗑️ Deleted temp file:', req.file.filename);
                }
            } catch (unlinkError) {
                console.warn('⚠️ Failed to delete temp file:', unlinkError.message);
            }
        } catch (error) {
            console.error('❌ Error uploading image to Cloudinary:', error);

            // Xóa file tạm ngay cả khi upload fail
            try {
                const fs = await import('fs');
                if (req.file && req.file.path) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (unlinkError) {
                console.error('❌ Failed to delete temp file:', unlinkError.message);
            }

            return res.status(500).json({
                message: 'Error uploading image to Cloudinary',
                error: error.message,
                details: process.env.NODE_ENV === 'production' ? undefined : error.stack
            });
        }

        // Validate dates
        const start = new Date(itemStartDate);
        const end = new Date(itemEndDate);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.error('❌ Create auction: Invalid date format', { itemStartDate, itemEndDate });
            return res.status(400).json({ message: 'Invalid date format' });
        }

        if (start < now) {
            console.error('❌ Create auction: Start time in past', { start, now });
            return res.status(400).json({ message: 'Start time cannot be in the past' });
        }

        if (end <= start) {
            console.error('❌ Create auction: End date before start date', { start, end });
            return res.status(400).json({ message: 'Auction end date must be after start date' });
        }

        // Validate price
        const price = parseFloat(startingPrice);
        if (isNaN(price) || price <= 0) {
            console.error('❌ Create auction: Invalid price', { startingPrice, price });
            return res.status(400).json({ message: 'Starting price must be a positive number' });
        }

        console.log('📝 Creating auction with data:', {
            itemName,
            startingPrice: price,
            itemCategory,
            seller: req.user.id,
            itemStartDate: start,
            itemEndDate: end
        });

        const newAuction = new Product({
            itemName,
            startingPrice: price,
            currentPrice: price,
            itemDescription,
            itemCategory,
            itemPhoto: imageUrl,
            itemStartDate: start,
            itemEndDate: end,
            seller: req.user.id,
        });

        await newAuction.save();
        console.log('✅ Auction created successfully:', newAuction._id);

        res.status(201).json({ message: 'Auction created successfully', newAuction });
    } catch (error) {
        console.error('❌ Error creating auction:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Request body:', req.body);
        console.error('❌ Request file:', req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');
        console.error('❌ User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');

        res.status(500).json({
            message: 'Error creating auction',
            error: error.message,
            details: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

export const showAuction = async (req, res) => {
    try {
        // Show all approved auctions (including ended ones - they will be dimmed on frontend)
        const auction = await Product.find({
            status: 'approved'
        }).sort({ itemEndDate: -1 }); // Sort: active first, then ended

        const userId = req.user?.id;

        const formatted = auction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidsCount: auction.bids?.length || 0,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemCategory: auction.itemCategory,
            sellerName: auction.seller?.isActive === false
                ? "Tài khoản bị vô hiệu hóa"
                : (auction.seller?.name || "Người dùng không tồn tại"),
            sellerActive: auction.seller?.isActive !== false,
            itemPhoto: auction.itemPhoto,
            likesCount: auction.likesCount || 0,
            isLikedByUser: userId ? auction.likes?.some(like => like.toString() === userId) : false,
            isEnded: new Date(auction.itemEndDate) < new Date() // Flag for frontend
        }));

        // Sort: active auctions first, then ended auctions
        formatted.sort((a, b) => {
            if (a.isEnded && !b.isEnded) return 1;
            if (!a.isEnded && b.isEnded) return -1;
            return b.timeLeft - a.timeLeft;
        });

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}

export const auctionById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Populate bidder name and seller info
        const auction = await Product.findById(id)
            .populate('bids.bidder', 'name')
            .populate('seller', 'name isActive');

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Check if user can view this auction
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        const isOwner = auction.seller._id.toString() === userId;

        // Only approved auctions are public, unless you're admin or owner
        if (auction.status !== 'approved' && !isAdmin && !isOwner) {
            return res.status(403).json({
                message: 'This auction is not available',
                status: auction.status
            });
        }

        // Sort bids if present
        if (auction.bids && auction.bids.length > 0) {
            auction.bids.sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime));
        }

        res.status(200).json(auction);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auction details', error: error.message });
    }
}

export const placeBid = async (req, res) => {
    try {
        const { bidAmount } = req.body;
        const user = req.user.id;
        const { id } = req.params;

        const product = await Product.findById(id)
            .populate('bids.bidder', "name")
            .populate('seller', 'isActive');
        if (!product) return res.status(404).json({ message: "Auction not found" });

        // Check if auction has ended
        if (new Date(product.itemEndDate) < new Date()) {
            return res.status(400).json({ message: "Phiên đấu giá đã kết thúc. Không thể đặt giá thêm." });
        }

        // Check if auction is approved
        if (product.status !== 'approved') {
            const messages = {
                pending: "Đấu giá này đang chờ phê duyệt và chưa thể nhận đặt giá.",
                rejected: "Đấu giá này đã bị từ chối và không thể nhận đặt giá."
            };
            return res.status(403).json({
                message: messages[product.status] || "Đấu giá này không thể nhận đặt giá.",
                status: product.status
            });
        }

        // Check if seller is active
        if (product.seller && product.seller.isActive === false) {
            return res.status(403).json({ message: "Không thể đấu giá. Tài khoản người bán đã bị vô hiệu hóa." });
        }

        const minBid = Math.max(product.currentPrice, product.startingPrice) + 1;
        const maxBid = Math.max(product.currentPrice, product.startingPrice) + 10;
        if (bidAmount < minBid) return res.status(400).json({ message: `Bid must be at least Rs ${minBid}` })
        if (bidAmount > maxBid) return res.status(400).json({ message: `Bid must be at max Rs ${maxBid}` })

        // Thông báo cho client gửi bid qua socket thay vì xử lý trực tiếp
        // Socket sẽ xử lý validation giá trùng và lưu vào Redis + MongoDB
        res.status(200).json({
            message: "Please submit bid via socket connection",
            socketEvent: "auction:bid",
            payload: {
                auctionId: id,
                userId: user,
                amount: bidAmount
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error placing bid", error: error.message })
    }
}

export const dashboardData = async (req, res) => {
    try {
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const dateNow = new Date();

        // Get statistics - only count approved auctions for activeAuctions
        const stats = await Product.aggregate([
            {
                $facet: {
                    totalAuctions: [{ $count: "count" }],
                    userAuctionCount: [{ $match: { seller: userObjectId } }, { $count: "count" }],
                    activeAuctions: [
                        {
                            $match: {
                                itemStartDate: { $lte: dateNow },
                                itemEndDate: { $gte: dateNow },
                                status: 'approved'  // Only count approved auctions
                            }
                        },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const totalAuctions = stats[0]?.totalAuctions[0]?.count || 0;
        const userAuctionCount = stats[0]?.userAuctionCount[0]?.count || 0;
        const activeAuctions = stats[0]?.activeAuctions[0]?.count || 0;

        // Get latest global auctions with error handling - only approved auctions
        let latestAuctions = [];
        try {
            const globalAuction = await Product.find({
                itemEndDate: { $gt: dateNow },
                status: 'approved'  // Only show approved auctions to public
            })
                .populate("seller", "name isActive")
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            latestAuctions = globalAuction.map(auction => ({
                _id: auction._id,
                itemName: auction.itemName,
                itemDescription: auction.itemDescription,
                currentPrice: auction.currentPrice,
                startingPrice: auction.startingPrice,
                bidsCount: auction.bids?.length || 0,
                timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
                itemCategory: auction.itemCategory,
                sellerName: auction.seller?.name || "Người dùng không tồn tại",
                sellerActive: auction.seller?.isActive !== false,
                itemPhoto: auction.itemPhoto,
                status: auction.status,
            }));
        } catch (err) {
        }

        // Get user's auctions with error handling - show all statuses
        let latestUserAuctions = [];
        try {
            const userAuction = await Product.find({ seller: userObjectId })
                .populate("seller", "name isActive")
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();


            latestUserAuctions = userAuction.map(auction => ({
                _id: auction._id,
                itemName: auction.itemName,
                itemDescription: auction.itemDescription,
                currentPrice: auction.currentPrice,
                startingPrice: auction.startingPrice,
                bidsCount: auction.bids?.length || 0,
                timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
                itemCategory: auction.itemCategory,
                sellerName: auction.seller?.name || "Người dùng không tồn tại",
                sellerActive: auction.seller?.isActive !== false,
                itemPhoto: auction.itemPhoto,
                status: auction.status,
                rejectionReason: auction.rejectionReason,
            }));
        } catch (err) {
        }

        return res.status(200).json({
            totalAuctions,
            userAuctionCount,
            activeAuctions,
            latestAuctions,
            latestUserAuctions
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error getting dashboard data",
            error: error.message
        });
    }
}

export const myAuction = async (req, res) => {
    try {
        const auction = await Product.find({ seller: req.user.id })
            .populate("seller", "name isActive")
            .select("itemName itemDescription currentPrice bids itemEndDate itemCategory itemPhoto seller status rejectionReason createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const formatted = auction.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            bidsCount: auction.bids?.length || 0,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemCategory: auction.itemCategory,
            status: auction.status,
            rejectionReason: auction.rejectionReason,
            createdAt: auction.createdAt,
            sellerName: auction.seller?.name || "Người dùng không tồn tại",
            itemPhoto: auction.itemPhoto,
        }));

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching your auctions', error: error.message });
    }
}

// Delete auction (Admin only)
export const deleteAuction = async (req, res) => {
    try {
        const { id } = req.params;

        // Find auction
        const auction = await Product.findById(id);

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Delete auction
        await Product.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Auction deleted successfully',
            deletedAuction: {
                _id: auction._id,
                itemName: auction.itemName
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Error deleting auction', error: error.message });
    }
}

// Endpoint mới để client biết cần join room khi xem auction
export const joinAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Product.findById(id);

        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        res.status(200).json({
            message: "Join auction room via socket",
            socketEvent: "auction:join",
            payload: { auctionId: id },
            auctionInfo: {
                _id: auction._id,
                itemName: auction.itemName,
                currentPrice: auction.currentPrice,
                itemEndDate: auction.itemEndDate
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error joining auction', error: error.message });
    }
}

export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const likeIndex = product.likes.indexOf(userId);
        const wasLiked = likeIndex > -1;

        if (wasLiked) {
            // Unlike
            product.likes.splice(likeIndex, 1);
            product.likesCount = Math.max(0, product.likesCount - 1);
        } else {
            // Like
            product.likes.push(userId);
            product.likesCount += 1;
        }

        await product.save();

        // 🔥 Emit socket event for real-time updates
        if (req.io) {
            req.io.emit('auction:like:updated', {
                auctionId: id,
                userId: userId,
                isLiked: !wasLiked,
                likesCount: product.likesCount,
                timestamp: new Date()
            });
            console.log(`📡 Socket event emitted: auction:like:updated for auction ${id}`);
        }

        res.status(200).json({
            message: wasLiked ? "Unliked" : "Liked",
            isLiked: !wasLiked,
            likesCount: product.likesCount
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling like", error: error.message });
    }
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all auctions for admin (including ended auctions)
 * Used for admin testing and management
 */
export const getAllAuctionsAdmin = async (req, res) => {
    try {
        const auctions = await Product.find({})
            .populate('seller', 'name isActive')
            .populate('winner', 'name email')
            .sort({ itemEndDate: -1 }); // Sort by end date descending (newest first)

        const formatted = auctions.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            startingPrice: auction.startingPrice,
            bidsCount: auction.bids?.length || 0,
            bids: auction.bids,
            itemCategory: auction.itemCategory,
            itemEndDate: auction.itemEndDate,
            itemStartDate: auction.itemStartDate,
            itemPhoto: auction.itemPhoto,
            seller: auction.seller,
            winner: auction.winner,
            // Status fields
            status: auction.status, // pending, approved, rejected
            auctionStatus: auction.auctionStatus, // active, ended, completed, cancelled, expired
            // Deposit fields
            depositRequired: auction.depositRequired,
            depositPercentage: auction.depositPercentage,
            depositAmount: auction.depositAmount,
            depositPaid: auction.depositPaid,
            depositPaidAt: auction.depositPaidAt,
            depositDeadline: auction.depositDeadline,
            depositPaymentMethod: auction.depositPaymentMethod,
            // Additional info
            likesCount: auction.likesCount || 0,
            createdAt: auction.createdAt,
            updatedAt: auction.updatedAt
        }));

        res.status(200).json({ auctions: formatted });
    } catch (error) {
        console.error('Error fetching all auctions for admin:', error);
        return res.status(500).json({
            message: 'Error fetching auctions',
            error: error.message
        });
    }
};

// ==================== DEPOSIT MANAGEMENT ====================

/**
 * Get deposit information for an auction
 * Used by winner to check deposit requirements and deadline
 */
export const getDepositInfo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid auction ID' });
        }

        const auction = await Product.findById(id)
            .populate('winner', 'name email')
            .populate('seller', 'name email')
            .select('itemName currentPrice winner depositRequired depositPercentage depositAmount depositPaid depositPaidAt depositDeadline depositPaymentMethod auctionStatus itemEndDate');

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Check if user is the winner
        const isWinner = auction.winner && auction.winner._id.toString() === req.user.id;
        const isSeller = auction.seller._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isWinner && !isSeller && !isAdmin) {
            return res.status(403).json({ error: 'Only the winner, seller, or admin can view deposit information' });
        }

        res.status(200).json({
            auction: {
                id: auction._id,
                itemName: auction.itemName,
                finalPrice: auction.currentPrice,
                winner: auction.winner,
                seller: auction.seller,
                depositRequired: auction.depositRequired,
                depositPercentage: auction.depositPercentage,
                depositAmount: auction.depositAmount,
                depositPaid: auction.depositPaid,
                depositPaidAt: auction.depositPaidAt,
                depositDeadline: auction.depositDeadline,
                depositPaymentMethod: auction.depositPaymentMethod,
                auctionStatus: auction.auctionStatus,
                itemEndDate: auction.itemEndDate
            }
        });
    } catch (error) {
        console.error('Error getting deposit info:', error);
        res.status(500).json({ error: 'Failed to get deposit information', details: error.message });
    }
};

/**
 * Submit deposit payment
 * Winner submits proof of deposit payment
 */
export const submitDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, transactionId, amount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid auction ID' });
        }

        // Validate input
        if (!paymentMethod) {
            return res.status(400).json({ error: 'Payment method is required' });
        }

        const validMethods = ['bank_transfer', 'cash', 'credit_card', 'paypal'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const auction = await Product.findById(id);

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Check if user is the winner
        if (!auction.winner || auction.winner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the auction winner can submit deposit' });
        }

        // Check if auction has ended
        if (auction.auctionStatus !== 'ended') {
            return res.status(400).json({ error: 'Auction has not ended yet' });
        }

        // Check if deposit already paid
        if (auction.depositPaid) {
            return res.status(400).json({ error: 'Deposit has already been paid' });
        }

        // Check if deadline passed
        if (auction.depositDeadline && new Date() > auction.depositDeadline) {
            return res.status(400).json({ error: 'Deposit deadline has passed' });
        }

        // Verify amount matches required deposit
        if (amount && Math.abs(amount - auction.depositAmount) > 0.01) {
            return res.status(400).json({
                error: `Deposit amount must be exactly ${auction.depositAmount}. You provided ${amount}`
            });
        }

        // Update deposit status
        auction.depositPaid = true;
        auction.depositPaidAt = new Date();
        auction.depositPaymentMethod = paymentMethod;
        if (transactionId) {
            auction.depositTransactionId = transactionId;
        }
        auction.auctionStatus = 'completed';

        await auction.save();

        // TODO: Send notification to seller
        // TODO: Send confirmation email to winner

        res.status(200).json({
            message: 'Deposit submitted successfully',
            auction: {
                id: auction._id,
                depositPaid: auction.depositPaid,
                depositPaidAt: auction.depositPaidAt,
                depositPaymentMethod: auction.depositPaymentMethod,
                auctionStatus: auction.auctionStatus
            }
        });
    } catch (error) {
        console.error('Error submitting deposit:', error);
        res.status(500).json({ error: 'Failed to submit deposit', details: error.message });
    }
};

/**
 * Finalize auction (called when auction ends)
 * Determines winner and sets deposit requirements
 * This should be called by a cron job or when checking auction status
 */
export const finalizeAuction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid auction ID' });
        }

        const auction = await Product.findById(id);

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Check if auction has ended
        const now = new Date();
        const endDate = new Date(auction.itemEndDate);

        if (now < endDate) {
            return res.status(400).json({ error: 'Auction has not ended yet' });
        }

        // Check if already finalized
        if (auction.auctionStatus === 'ended' || auction.auctionStatus === 'completed') {
            return res.status(400).json({ error: 'Auction already finalized' });
        }

        // Find highest bidder
        if (!auction.bids || auction.bids.length === 0) {
            auction.auctionStatus = 'expired';
            await auction.save();
            return res.status(200).json({
                message: 'Auction ended with no bids',
                auctionStatus: 'expired'
            });
        }

        const sortedBids = [...auction.bids].sort((a, b) => b.bidAmount - a.bidAmount);
        const highestBid = sortedBids[0];

        // Set winner
        auction.winner = highestBid.bidder;
        auction.currentPrice = highestBid.bidAmount;
        auction.finalPrice = highestBid.bidAmount;
        auction.auctionStatus = 'ended';

        // Set payment deadline for winner: 1 tuần sau khi phiên kết thúc
        const paymentDeadline = new Date(endDate);
        paymentDeadline.setDate(paymentDeadline.getDate() + 7);
        auction.paymentDeadline = paymentDeadline;
        auction.paymentStatus = 'pending';

        // Calculate deposit (tiền đặt cọc) nếu được yêu cầu
        if (auction.depositRequired) {
            auction.depositAmount = Math.round(
                (auction.currentPrice * auction.depositPercentage) / 100
            );

            // Set deposit deadline (ví dụ: 3 ngày sau khi phiên kết thúc)
            const depositDeadline = new Date(endDate);
            depositDeadline.setDate(depositDeadline.getDate() + 3);
            auction.depositDeadline = depositDeadline;
        }

        await auction.save();

        // 🔥 XỬ LÝ TIỀN CỌC:
        // - Hoàn tiền cho người thua
        // - Trừ tiền cọc từ giá cuối của người thắng
        let depositResult = { refunded: 0, deducted: 0 };
        try {
            depositResult = await processAuctionDeposits(id, highestBid.bidder);
            console.log(`💰 Deposit processed: ${depositResult.refunded} refunded, ${depositResult.deducted} deducted`);
        } catch (depositError) {
            console.error('Error processing deposits:', depositError);
            // Continue anyway - deposits can be processed manually
        }

        // Calculate final price after deposit deduction
        const depositDeducted = auction.depositAmount || 0;
        const finalPriceAfterDeposit = auction.currentPrice - depositDeducted;

        // ==================== TÍNH TIỀN NGƯỜI BÁN NHẬN ĐƯỢC ====================
        // Theo quy định đấu giá quốc tế: người đăng nhận % trên giá cuối cùng
        const commissionPercent = auction.platformCommissionPercentage || 10; // mặc định 10%
        const platformCommissionAmount = Math.round(
            (auction.finalPrice * commissionPercent) / 100
        );
        const sellerAmount = auction.finalPrice - platformCommissionAmount;

        auction.platformCommissionPercentage = commissionPercent;
        auction.platformCommissionAmount = platformCommissionAmount;
        auction.sellerAmount = sellerAmount;

        // Populate winner info for response
        await auction.populate('winner', 'name email');

        // TODO: Send notification to winner
        // TODO: Send notification to seller

        res.status(200).json({
            message: 'Auction finalized successfully',
            auction: {
                id: auction._id,
                winner: auction.winner,
                finalPrice: auction.finalPrice,
                depositDeducted: depositDeducted,
                finalPriceAfterDeposit: finalPriceAfterDeposit,
                depositRequired: auction.depositRequired,
                depositAmount: auction.depositAmount,
                depositDeadline: auction.depositDeadline,
                auctionStatus: auction.auctionStatus,
                paymentDeadline: auction.paymentDeadline,
                paymentStatus: auction.paymentStatus,
                platformCommissionPercentage: auction.platformCommissionPercentage,
                platformCommissionAmount: auction.platformCommissionAmount,
                sellerAmount: auction.sellerAmount
            },
            depositProcessing: depositResult
        });
    } catch (error) {
        console.error('Error finalizing auction:', error);
        res.status(500).json({ error: 'Failed to finalize auction', details: error.message });
    }
};

/**
 * Winner pays for the auctioned product
 * - Chỉ người thắng (winner) mới được thanh toán
 * - Hạn thanh toán: trong vòng 1 tuần kể từ khi phiên kết thúc (paymentDeadline)
 * - Số tiền người đăng sản phẩm nhận được = % giá đấu giá (sellerAmount)
 *   theo quy định đấu giá quốc tế (platformCommissionPercentage là phí sàn)
 */
export const payForWonAuction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid auction ID' });
        }

        const auction = await Product.findById(id)
            .populate('seller', 'name email')
            .populate('winner', 'name email');

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        // Nếu chưa có winner nhưng phiên đã kết thúc và có bid,
        // tự động xác định winner giống finalizeAuction để người thắng có thể thanh toán.
        const now = new Date();
        const endDate = new Date(auction.itemEndDate);

        let justFinalized = false;
        if (!auction.winner && endDate <= now && auction.bids && auction.bids.length > 0) {
            const sortedBids = [...auction.bids].sort((a, b) => b.bidAmount - a.bidAmount);
            const highestBid = sortedBids[0];

            auction.winner = highestBid.bidder;
            auction.currentPrice = highestBid.bidAmount;
            auction.finalPrice = highestBid.bidAmount;
            auction.auctionStatus = 'ended';
            justFinalized = true;

            // Thiết lập hạn thanh toán nếu chưa có (1 tuần sau khi kết thúc)
            if (!auction.paymentDeadline) {
                const paymentDeadline = new Date(endDate);
                paymentDeadline.setDate(paymentDeadline.getDate() + 7);
                auction.paymentDeadline = paymentDeadline;
            }

            await auction.save();

            // Nếu vừa tự động finalize ở đây, cần xử lý tiền đặt cọc:
            // - Hoàn tiền người thua
            // - Đánh dấu cọc của người thắng là 'deducted'
            try {
                await processAuctionDeposits(id, highestBid.bidder);
            } catch (depositError) {
                console.error('Error processing deposits in payForWonAuction:', depositError);
            }
        }

        // Must have a winner at this point
        if (!auction.winner) {
            return res.status(400).json({ error: 'Auction does not have a winner yet' });
        }

        // Check if current user is the winner
        if (auction.winner._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Only the auction winner can pay for this auction' });
        }

        // Không cho thanh toán nếu phiên đã bị hủy / hết hạn
        if (auction.auctionStatus === 'cancelled' || auction.auctionStatus === 'expired') {
            return res.status(400).json({ error: 'Auction is not in a payable state' });
        }

        // Check payment status
        if (auction.paymentStatus === 'paid') {
            return res.status(400).json({ error: 'Auction has already been paid' });
        }

        // Check payment deadline (1 week after auction end)
        if (auction.paymentDeadline && now > auction.paymentDeadline) {
            // Mark as expired
            auction.paymentStatus = 'expired';
            auction.auctionStatus = 'cancelled';
            await auction.save();
            return res.status(400).json({ error: 'Payment deadline has passed. Auction payment expired.' });
        }

        // Tính toán lại số tiền nếu cần (dựa trên finalPrice và % hoa hồng)
        const finalPrice = auction.finalPrice || auction.currentPrice;
        const commissionPercent = auction.platformCommissionPercentage || 10;
        const platformCommissionAmount = Math.round(
            (finalPrice * commissionPercent) / 100
        );
        const sellerAmount = finalPrice - platformCommissionAmount;

        auction.finalPrice = finalPrice;
        auction.platformCommissionPercentage = commissionPercent;
        auction.platformCommissionAmount = platformCommissionAmount;
        auction.sellerAmount = sellerAmount;

        // ==================== KIỂM TRA VÀ TRỪ TIỀN TỪ VÍ ====================
        // Tính số tiền cần thanh toán = finalPrice - depositAmount (đã trừ tiền cọc)
        const depositAmount = auction.depositAmount || 0;
        const amountToPay = finalPrice - depositAmount;

        // Lấy thông tin user để kiểm tra số dư ví
        const winnerUser = await User.findById(req.user.id).select('balance');
        if (!winnerUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = winnerUser.balance || 0;

        // Kiểm tra số dư ví có đủ để thanh toán không
        if (currentBalance < amountToPay) {
            return res.status(400).json({
                error: 'Số dư ví không đủ để thanh toán',
                code: 'INSUFFICIENT_WALLET_BALANCE',
                currentBalance,
                requiredAmount: amountToPay,
                finalPrice,
                depositAmount,
                amountToPay
            });
        }

        // Trừ tiền từ ví người thắng
        const previousBalance = currentBalance;
        winnerUser.balance = previousBalance - amountToPay;
        await winnerUser.save();
        console.log(`💰 Payment: User ${req.user.id} -${amountToPay} (Final: ${finalPrice}, Deposit: ${depositAmount}). Balance: ${previousBalance} -> ${winnerUser.balance}`);

        // Cộng tiền vào ví người bán (sellerAmount)
        const sellerUser = await User.findById(auction.seller._id || auction.seller).select('balance');
        if (sellerUser) {
            const sellerPreviousBalance = sellerUser.balance || 0;
            sellerUser.balance = sellerPreviousBalance + sellerAmount;
            await sellerUser.save();
            console.log(`💰 Seller payment: User ${auction.seller._id || auction.seller} +${sellerAmount}. Balance: ${sellerPreviousBalance} -> ${sellerUser.balance}`);
        }

        // Tạo transaction record cho thanh toán (TRƯỚC KHI SAVE AUCTION)
        let paymentTransaction = null;
        let sellerTransaction = null;
        try {
            const Transaction = (await import('../models/transaction.js')).default;

            // Transaction cho người mua (trừ tiền)
            paymentTransaction = await Transaction.create({
                user: req.user.id,
                type: 'payment',
                amount: amountToPay,
                status: 'completed',
                paymentMethod: 'wallet',
                paymentGateway: 'wallet',
                orderId: auction._id.toString(),
                description: `Thanh toán sản phẩm: ${auction.itemName}`,
                balanceBefore: previousBalance,
                balanceAfter: winnerUser.balance,
                relatedAuction: auction._id,
                completedAt: new Date()
            });
            console.log(`✅ Payment transaction created: ${paymentTransaction._id}`);

            // Transaction cho người bán (cộng tiền)
            if (sellerUser) {
                const sellerBalanceBefore = sellerUser.balance - sellerAmount;
                sellerTransaction = await Transaction.create({
                    user: auction.seller._id || auction.seller,
                    type: 'payment',
                    amount: sellerAmount,
                    status: 'completed',
                    paymentMethod: 'wallet',
                    paymentGateway: 'wallet',
                    orderId: auction._id.toString(),
                    description: `Nhận tiền bán sản phẩm: ${auction.itemName}`,
                    balanceBefore: sellerBalanceBefore,
                    balanceAfter: sellerUser.balance,
                    relatedAuction: auction._id,
                    completedAt: new Date()
                });
                console.log(`✅ Seller transaction created: ${sellerTransaction._id}`);
            }
        } catch (transactionError) {
            console.error('❌ Error creating transaction record:', transactionError);
            console.error('❌ Transaction error details:', transactionError.message, transactionError.stack);
            // Nếu transaction fail, rollback balance changes
            winnerUser.balance = previousBalance;
            await winnerUser.save();
            if (sellerUser) {
                sellerUser.balance = sellerUser.balance - sellerAmount;
                await sellerUser.save();
            }
            return res.status(500).json({
                error: 'Failed to create transaction record',
                details: transactionError.message
            });
        }

        // Đánh dấu đã thanh toán
        auction.paymentStatus = 'paid';
        auction.paymentCompletedAt = now;
        auction.auctionStatus = 'completed';
        auction.isSold = true;

        await auction.save();

        return res.status(200).json({
            message: 'Payment for auction completed successfully',
            auction: {
                id: auction._id,
                itemName: auction.itemName,
                finalPrice: auction.finalPrice,
                paymentStatus: auction.paymentStatus,
                paymentDeadline: auction.paymentDeadline,
                paymentCompletedAt: auction.paymentCompletedAt,
                auctionStatus: auction.auctionStatus,
                winner: auction.winner,
                seller: auction.seller,
                platformCommissionPercentage: auction.platformCommissionPercentage,
                platformCommissionAmount: auction.platformCommissionAmount,
                sellerAmount: auction.sellerAmount
            }
        });
    } catch (error) {
        console.error('Error paying for won auction:', error);
        return res.status(500).json({ error: 'Failed to process auction payment', details: error.message });
    }
};

/**
 * Get won auctions, participated auctions, and my auctions for current user
 * - wonAuctions: auctions where user has the highest bid (time expired)
 * - participatedAuctions: auctions where user placed bids but didn't win (time expired)
 * - myAuctions: auctions created by the user (time expired)
 */
export const getWonAuctions = async (req, res) => {
    try {
        const userId = req.user.id.toString(); // Ensure string
        const now = new Date();

        console.log('getWonAuctions called for userId:', userId);
        console.log('Current time:', now);

        // Get all expired auctions that have bids
        const allExpiredAuctions = await Product.find({
            status: 'approved',
            itemEndDate: { $lte: now }, // Auction time has expired
            'bids.0': { $exists: true } // Has at least one bid
        })
            .populate('seller', 'name email')
            .populate('bids.bidder', 'name email')
            .select('itemName itemDescription itemPhoto currentPrice startingPrice itemEndDate depositRequired depositPercentage depositAmount depositPaid depositPaidAt depositDeadline auctionStatus winner bids seller')
            .sort({ itemEndDate: -1 });

        console.log('Found expired auctions with bids:', allExpiredAuctions.length);

        // Separate into won, participated based on highest bidder
        const wonAuctions = [];
        const participatedAuctions = [];

        for (const auction of allExpiredAuctions) {
            // Find highest bid
            const sortedBids = [...auction.bids].sort((a, b) => b.bidAmount - a.bidAmount);
            const highestBid = sortedBids[0];

            // Get bidder ID properly
            let highestBidderId = null;
            if (highestBid?.bidder) {
                highestBidderId = highestBid.bidder._id
                    ? highestBid.bidder._id.toString()
                    : highestBid.bidder.toString();
            }

            // Check if user participated in this auction
            const userBids = auction.bids.filter(bid => {
                let bidderId = null;
                if (bid.bidder) {
                    bidderId = bid.bidder._id
                        ? bid.bidder._id.toString()
                        : bid.bidder.toString();
                }
                return bidderId === userId;
            });

            if (userBids.length > 0) {
                const userHighestBid = Math.max(...userBids.map(b => b.bidAmount));

                console.log(`Auction ${auction.itemName}: userId=${userId}, highestBidderId=${highestBidderId}, match=${highestBidderId === userId}`);

                if (highestBidderId === userId) {
                    // User won this auction
                    // ==================== THÔNG TIN THANH TOÁN (PAYMENT) ====================
                    // finalPrice: giá thắng
                    const finalPrice = auction.finalPrice || auction.currentPrice;

                    // Hạn thanh toán: ưu tiên paymentDeadline nếu đã set; nếu chưa thì mặc định 7 ngày sau khi kết thúc
                    const defaultPaymentDeadline = new Date(new Date(auction.itemEndDate).getTime() + 7 * 24 * 60 * 60 * 1000);
                    const paymentDeadline = auction.paymentDeadline || defaultPaymentDeadline;

                    // Trạng thái thanh toán (fallback theo trạng thái phiên và thời gian)
                    let paymentStatus = auction.paymentStatus;
                    const now = new Date();
                    const deadline = auction.paymentDeadline || defaultPaymentDeadline;

                    if (!paymentStatus) {
                        if (auction.paymentCompletedAt || auction.auctionStatus === 'completed') {
                            paymentStatus = 'paid';
                        } else if (deadline && now > deadline) {
                            paymentStatus = 'expired';
                        } else {
                            paymentStatus = 'pending';
                        }
                    }

                    // Tính tiền hoa hồng sàn & tiền seller nhận (nếu chưa có)
                    const commissionPercent = auction.platformCommissionPercentage || 10;
                    const platformCommissionAmount = auction.platformCommissionAmount ||
                        Math.round(finalPrice * commissionPercent / 100);
                    const sellerAmount = auction.sellerAmount || (finalPrice - platformCommissionAmount);

                    // Thông tin đặt cọc (để người thắng biết đã trừ bao nhiêu khỏi số tiền phải thanh toán)
                    const depositPercentage = auction.depositPercentage || 20;
                    const calculatedDepositAmount = auction.depositAmount ||
                        Math.round(finalPrice * depositPercentage / 100);

                    wonAuctions.push({
                        _id: auction._id,
                        itemName: auction.itemName,
                        itemDescription: auction.itemDescription,
                        itemPhoto: auction.itemPhoto,
                        finalPrice: finalPrice,
                        itemEndDate: auction.itemEndDate,
                        auctionStatus: auction.auctionStatus,
                        // Payment info
                        paymentStatus: paymentStatus,
                        paymentDeadline: paymentDeadline,
                        paymentCompletedAt: auction.paymentCompletedAt,
                        // Commission info (nếu cần hiển thị)
                        platformCommissionPercentage: commissionPercent,
                        platformCommissionAmount: platformCommissionAmount,
                        sellerAmount: sellerAmount,
                        // Deposit info (cho người thắng tính số tiền phải thanh toán)
                        depositRequired: auction.depositRequired !== false,
                        depositPercentage: depositPercentage,
                        depositAmount: calculatedDepositAmount,
                        // Seller info
                        seller: auction.seller
                    });
                } else {
                    // User participated but didn't win
                    participatedAuctions.push({
                        _id: auction._id,
                        itemName: auction.itemName,
                        itemDescription: auction.itemDescription,
                        itemPhoto: auction.itemPhoto,
                        currentPrice: auction.currentPrice,
                        itemEndDate: auction.itemEndDate,
                        auctionStatus: auction.auctionStatus,
                        seller: auction.seller,
                        winner: highestBid?.bidder,
                        userHighestBid: userHighestBid,
                        totalBids: auction.bids.length
                    });
                }
            }
        }

        console.log('Won auctions:', wonAuctions.length);
        console.log('Participated auctions:', participatedAuctions.length);

        // Get auctions created by user (time expired)
        // User must be the SELLER (creator) of the auction
        const myAuctionsRaw = await Product.find({
            seller: userId,
            status: 'approved',
            itemEndDate: { $lte: now } // Time expired
        })
            .populate('seller', 'name email') // Also populate seller to verify
            .populate('bids.bidder', 'name email')
            .select('itemName itemDescription itemPhoto currentPrice startingPrice itemEndDate depositRequired depositPercentage depositAmount depositPaid depositPaidAt depositDeadline auctionStatus winner bids seller')
            .sort({ itemEndDate: -1 });

        console.log('My auctions (as seller):', myAuctionsRaw.length);
        myAuctionsRaw.forEach(a => {
            const sellerId = a.seller?._id?.toString() || a.seller?.toString();
            console.log(`  - ${a.itemName}: sellerId=${sellerId}, currentUserId=${userId}, match=${sellerId === userId}`);
        });

        // Format my auctions with winner info
        const myAuctions = myAuctionsRaw.map(auction => {
            // Find highest bidder as winner
            let winner = null;
            if (auction.bids && auction.bids.length > 0) {
                const sortedBids = [...auction.bids].sort((a, b) => b.bidAmount - a.bidAmount);
                winner = sortedBids[0]?.bidder;
            }

            // Calculate deposit amount if not already set
            const depositPercentage = auction.depositPercentage || 20;
            const calculatedDepositAmount = auction.depositAmount ||
                Math.round(auction.currentPrice * depositPercentage / 100);

            // Tính tiền seller nhận + hoa hồng sàn
            const finalPrice = auction.finalPrice || auction.currentPrice;
            const commissionPercent = auction.platformCommissionPercentage || 10;
            const platformCommissionAmount = auction.platformCommissionAmount ||
                Math.round(finalPrice * commissionPercent / 100);
            const sellerAmount = auction.sellerAmount || (finalPrice - platformCommissionAmount);

            return {
                _id: auction._id,
                itemName: auction.itemName,
                itemDescription: auction.itemDescription,
                itemPhoto: auction.itemPhoto,
                currentPrice: auction.currentPrice,
                startingPrice: auction.startingPrice,
                itemEndDate: auction.itemEndDate,
                auctionStatus: auction.auctionStatus,
                winner: winner,
                totalBids: auction.bids?.length || 0,
                depositRequired: auction.depositRequired !== false,
                depositPercentage: depositPercentage,
                depositAmount: calculatedDepositAmount,
                depositPaid: auction.depositPaid || false,
                depositPaidAt: auction.depositPaidAt,
                finalPrice: finalPrice,
                platformCommissionPercentage: commissionPercent,
                platformCommissionAmount: platformCommissionAmount,
                sellerAmount: sellerAmount
            };
        });

        res.status(200).json({
            wonCount: wonAuctions.length,
            participatedCount: participatedAuctions.length,
            myAuctionsCount: myAuctions.length,
            wonAuctions: wonAuctions,
            participatedAuctions: participatedAuctions,
            myAuctions: myAuctions
        });
    } catch (error) {
        console.error('Error getting won auctions:', error);
        res.status(500).json({ error: 'Failed to get won auctions', details: error.message });
    }
};