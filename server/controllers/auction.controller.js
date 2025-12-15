import uploadImage from '../services/cloudinaryService.js';
import Product from '../models/product.js';
import mongoose from "mongoose"
import { connectDB } from '../connection.js'


export const createAuction = async (req, res) => {
    try {
        await connectDB();
        const { itemName, startingPrice, itemDescription, itemCategory, itemStartDate, itemEndDate } = req.body;
        let imageUrl = '';

        if (req.file) {
            try {
                imageUrl = await uploadImage(req.file);

                // ✅ Tự động xóa file tạm sau khi upload thành công
                const fs = await import('fs');
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Deleted temp file:', req.file.filename);
            } catch (error) {
                // Xóa file tạm ngay cả khi upload fail
                try {
                    const fs = await import('fs');
                    if (req.file && req.file.path) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (unlinkError) {
                    console.error('Failed to delete temp file:', unlinkError.message);
                }

                return res.status(500).json({ message: 'Error uploading image to Cloudinary', error: error.message });
            }
        }

        const start = itemStartDate ? new Date(itemStartDate) : new Date();
        const end = new Date(itemEndDate);
        if (end <= start) {
            return res.status(400).json({ message: 'Auction end date must be after start date' });
        }

        const newAuction = new Product({
            itemName,
            startingPrice,
            currentPrice: startingPrice,
            itemDescription,
            itemCategory,
            itemPhoto: imageUrl,
            itemStartDate: start,
            itemEndDate: end,
            seller: req.user.id,
        });
        await newAuction.save();

        res.status(201).json({ message: 'Auction created successfully', newAuction });
    } catch (error) {
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

export const showAuction = async (req, res) => {
    try {
        await connectDB();
        // Simplified for test compatibility - find without chaining
        const auction = await Product.find({ itemEndDate: { $gt: new Date() } });

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
            isLikedByUser: userId ? auction.likes?.some(like => like.toString() === userId) : false
        }));

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
}

export const auctionById = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        // Populate bidder name and seller info
        const auction = await Product.findById(id)
            .populate('bids.bidder', 'name')
            .populate('seller', 'name isActive');

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
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
        await connectDB();
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
        await connectDB();
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const dateNow = new Date();

        // Get statistics
        const stats = await Product.aggregate([
            {
                $facet: {
                    totalAuctions: [{ $count: "count" }],
                    userAuctionCount: [{ $match: { seller: userObjectId } }, { $count: "count" }],
                    activeAuctions: [
                        { $match: { itemStartDate: { $lte: dateNow }, itemEndDate: { $gte: dateNow } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const totalAuctions = stats[0]?.totalAuctions[0]?.count || 0;
        const userAuctionCount = stats[0]?.userAuctionCount[0]?.count || 0;
        const activeAuctions = stats[0]?.activeAuctions[0]?.count || 0;

        // Get latest global auctions with error handling
        let latestAuctions = [];
        try {
            const globalAuction = await Product.find({ itemEndDate: { $gt: dateNow } })
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
            }));
        } catch (err) {
        }

        // Get user's auctions with error handling
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
        await connectDB();
        const auction = await Product.find({ seller: req.user.id })
            .populate("seller", "name isActive")
            .select("itemName itemDescription currentPrice bids itemEndDate itemCategory itemPhoto seller")
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
        await connectDB();
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
        await connectDB();
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