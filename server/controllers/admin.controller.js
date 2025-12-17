import Product from '../models/product.js';
import User from '../models/user.js';

export const getAdminDashboard = async (req, res) => {
    try {
        // Get statistics - only count active users and approved auctions
        const totalAuctions = await Product.countDocuments();
        const activeAuctions = await Product.countDocuments({
            itemEndDate: { $gt: new Date() },
            status: 'approved'
        });
        const totalUsers = await User.countDocuments({ isActive: { $ne: false } }); // Only active users
        const recentUsers = await User.countDocuments({
            isActive: { $ne: false }, // Only active users
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Get recent auctions for display - including ended ones (they will be dimmed on frontend)
        const recentAuctions = await Product.find({
            status: 'approved'
        })
            .populate('seller', 'name email isActive')
            .sort({ itemEndDate: -1 })
            .limit(20) // Get more to account for filtering
            .lean();

        // Filter out auctions from inactive sellers and format with timeLeft
        const filteredAuctions = recentAuctions
            .filter(auction => auction.seller && auction.seller.isActive !== false)
            .map(auction => ({
                _id: auction._id,
                itemName: auction.itemName,
                itemDescription: auction.itemDescription,
                currentPrice: auction.currentPrice,
                startingPrice: auction.startingPrice,
                bidsCount: auction.bids?.length || 0,
                timeLeft: Math.max(0, new Date(auction.itemEndDate) - new Date()),
                itemCategory: auction.itemCategory,
                sellerName: auction.seller?.name || "Unknown",
                sellerActive: auction.seller?.isActive !== false,
                itemPhoto: auction.itemPhoto,
                status: auction.status,
                isEnded: new Date(auction.itemEndDate) < new Date() // Flag for frontend
            }))
            // Sort: active auctions first, then ended auctions
            .sort((a, b) => {
                if (a.isEnded && !b.isEnded) return 1;
                if (!a.isEnded && b.isEnded) return -1;
                return b.timeLeft - a.timeLeft;
            })
            .slice(0, 10);

        // Get recent active users for display - only show active users
        const recentUsersList = await User.find({ isActive: { $ne: false } })
            .select('name email role createdAt lastLogin location avatar isActive')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get pending auctions count
        const pendingAuctions = await Product.countDocuments({ status: 'pending' });

        res.status(200).json({
            stats: {
                activeAuctions,
                totalAuctions,
                totalUsers,
                recentUsers,
                pendingAuctions
            },
            recentAuctions: filteredAuctions, // Only approved auctions from active sellers
            recentUsersList: recentUsersList
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin dashboard data', error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        // Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Build search query - only show active users (isActive = true or doesn't exist)
        let searchQuery = {
            isActive: { $ne: false } // Exclude users with isActive === false
        };

        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination info
        const totalUsers = await User.countDocuments(searchQuery);

        // Get users with pagination, search, and sorting
        const users = await User.find(searchQuery)
            .select('name email role createdAt signupAt lastLogin location avatar isActive verification')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();

        // Calculate pagination info
        const totalPages = Math.ceil(totalUsers / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

export const deleteUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot deactivate admin users'
            });
        }

        // Check if already deactivated
        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'User is already deactivated'
            });
        }

        // Deactivate the user (set isActive to false)
        await User.findByIdAndUpdate(userId, { isActive: false });

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully. Their auctions are now marked as inactive.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating user',
            error: error.message
        });
    }
};

// Reactivate user
export const reactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already active
        if (user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'User is already active'
            });
        }

        // Reactivate the user
        await User.findByIdAndUpdate(userId, { isActive: true });

        res.status(200).json({
            success: true,
            message: 'User reactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reactivating user',
            error: error.message
        });
    }
};

// Migration: Add isActive field to all existing users
export const migrateUsersIsActive = async (req, res) => {
    try {
        // Update all users that don't have isActive field
        const result = await User.updateMany(
            { isActive: { $exists: false } },
            { $set: { isActive: true } }
        );

        // Get stats
        const activeCount = await User.countDocuments({ isActive: true });
        const inactiveCount = await User.countDocuments({ isActive: false });
        const totalCount = await User.countDocuments({});

        res.status(200).json({
            success: true,
            message: 'Migration completed successfully',
            data: {
                updated: result.modifiedCount,
                matched: result.matchedCount,
                stats: {
                    total: totalCount,
                    active: activeCount,
                    inactive: inactiveCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error running migration',
            error: error.message
        });
    }
};

// ==================== AUCTION APPROVAL SYSTEM ====================

// Get pending auctions for admin approval
export const getPendingAuctions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get pending auctions with seller info
        const pendingAuctions = await Product.find({ status: 'pending' })
            .populate('seller', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPending = await Product.countDocuments({ status: 'pending' });
        const totalPages = Math.ceil(totalPending / limit);

        // Format auctions
        const formattedAuctions = pendingAuctions.map(auction => ({
            _id: auction._id,
            itemName: auction.itemName,
            itemDescription: auction.itemDescription,
            itemCategory: auction.itemCategory,
            itemPhoto: auction.itemPhoto,
            startingPrice: auction.startingPrice,
            currentPrice: auction.currentPrice,
            itemStartDate: auction.itemStartDate,
            itemEndDate: auction.itemEndDate,
            seller: {
                _id: auction.seller._id,
                name: auction.seller.name,
                email: auction.seller.email,
                avatar: auction.seller.avatar
            },
            status: auction.status,
            createdAt: auction.createdAt
        }));

        res.status(200).json({
            success: true,
            data: {
                auctions: formattedAuctions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalPending,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending auctions',
            error: error.message
        });
    }
};

// Approve auction
export const approveAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const adminId = req.user.id;

        // Find auction
        const auction = await Product.findById(auctionId);
        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if already approved
        if (auction.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Auction is already approved'
            });
        }

        // Calculate original auction duration
        const originalStart = new Date(auction.itemStartDate);
        const originalEnd = new Date(auction.itemEndDate);
        const durationMs = originalEnd - originalStart;

        // Update auction status and timing
        const now = new Date();
        auction.status = 'approved';
        auction.approvedBy = adminId;
        auction.approvedAt = now;

        // Reset start time to now and calculate new end time
        auction.itemStartDate = now;
        auction.itemEndDate = new Date(now.getTime() + durationMs);

        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Auction approved successfully. Countdown timer has started!',
            data: {
                auctionId: auction._id,
                itemName: auction.itemName,
                status: auction.status,
                approvedAt: auction.approvedAt,
                itemStartDate: auction.itemStartDate,
                itemEndDate: auction.itemEndDate,
                durationHours: Math.round(durationMs / (1000 * 60 * 60))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving auction',
            error: error.message
        });
    }
};

// Reject auction
export const rejectAuction = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { reason } = req.body;
        const adminId = req.user.id;

        // Validate rejection reason
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        // Find auction
        const auction = await Product.findById(auctionId);
        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if already rejected
        if (auction.status === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Auction is already rejected'
            });
        }

        // Update auction status
        auction.status = 'rejected';
        auction.rejectionReason = reason;
        auction.approvedBy = adminId;
        auction.approvedAt = new Date();
        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Auction rejected successfully',
            data: {
                auctionId: auction._id,
                itemName: auction.itemName,
                status: auction.status,
                rejectionReason: auction.rejectionReason
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting auction',
            error: error.message
        });
    }
};

// Get all auctions (for admin - includes all statuses)
export const getAllAuctions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || 'all'; // all, pending, approved, rejected
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { itemName: { $regex: search, $options: 'i' } },
                { itemDescription: { $regex: search, $options: 'i' } },
                { itemCategory: { $regex: search, $options: 'i' } }
            ];
        }

        // Get auctions
        const auctions = await Product.find(query)
            .populate('seller', 'name email avatar isActive')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalAuctions = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalAuctions / limit);

        // Get counts for different statuses
        const pendingCount = await Product.countDocuments({ status: 'pending' });
        const approvedCount = await Product.countDocuments({ status: 'approved' });
        const rejectedCount = await Product.countDocuments({ status: 'rejected' });

        res.status(200).json({
            success: true,
            data: {
                auctions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalAuctions,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                stats: {
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount,
                    total: pendingCount + approvedCount + rejectedCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching auctions',
            error: error.message
        });
    }
};