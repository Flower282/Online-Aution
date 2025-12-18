import Product from '../models/product.js';

/**
 * Public API: Get all approved auctions (READ-ONLY)
 * No authentication required
 * Returns safe, non-sensitive fields only
 */
export const getPublicAuctions = async (req, res) => {
    try {
        // Only show approved auctions
        const auctions = await Product.find({
            status: 'approved'
        })
            .populate('seller', 'name isActive')
            .sort({ itemEndDate: -1 })
            .select('-__v -status'); // Exclude internal fields

        const formatted = auctions.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            currentPrice: auction.currentPrice,
            startingPrice: auction.startingPrice,
            bidsCount: auction.bids?.length || 0,
            timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
            itemStartDate: auction.itemStartDate,
            itemEndDate: auction.itemEndDate,
            itemCategory: auction.itemCategory,
            sellerName: auction.seller?.isActive === false
                ? "Tài khoản bị vô hiệu hóa"
                : (auction.seller?.name || "Người dùng không tồn tại"),
            sellerActive: auction.seller?.isActive !== false,
            itemPhoto: auction.itemPhoto,
            likesCount: auction.likesCount || 0,
            isEnded: new Date(auction.itemEndDate) < new Date()
        }));

        // Sort: active auctions first, then ended auctions
        formatted.sort((a, b) => {
            if (a.isEnded && !b.isEnded) return 1;
            if (!a.isEnded && b.isEnded) return -1;
            return b.timeLeft - a.timeLeft;
        });

        res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error fetching auctions', 
            error: error.message 
        });
    }
};
