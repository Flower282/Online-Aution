import Product from '../models/product.js';
import User from '../models/user.js';
import { connectDB } from '../connection.js';

export const getAdminDashboard = async (req, res) => {
    try {
        await connectDB();

        // Get statistics - only count active users
        const totalAuctions = await Product.countDocuments();
        const activeAuctions = await Product.countDocuments({ itemEndDate: { $gt: new Date() } });
        const totalUsers = await User.countDocuments({ isActive: { $ne: false } }); // Only active users
        const recentUsers = await User.countDocuments({
            isActive: { $ne: false }, // Only active users
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        // Get recent active auctions for display - exclude auctions from inactive sellers
        const recentActiveAuctions = await Product.find({ itemEndDate: { $gt: new Date() } })
            .populate('seller', 'name email isActive')
            .sort({ createdAt: -1 })
            .limit(20) // Get more to account for filtering
            .lean();

        // Filter out auctions from inactive sellers and format with timeLeft
        const filteredAuctions = recentActiveAuctions
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
            }))
            .slice(0, 10);

        // Get recent active users for display - only show active users
        const recentUsersList = await User.find({ isActive: { $ne: false } })
            .select('name email role createdAt lastLogin location avatar isActive')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            stats: {
                activeAuctions,
                totalAuctions,
                totalUsers,
                recentUsers
            },
            recentAuctions: filteredAuctions, // Only auctions from active sellers
            recentUsersList: recentUsersList
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin dashboard data', error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        await connectDB();

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
            .select('name email role createdAt signupAt lastLogin location avatar isActive')
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
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

export const deleteUserById = async (req, res) => {
    try {
        await connectDB();

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
        console.error('Error deactivating user:', error);
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
        await connectDB();

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
        console.error('Error reactivating user:', error);
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
        await connectDB();

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
        console.error('Error running migration:', error);
        res.status(500).json({
            success: false,
            message: 'Error running migration',
            error: error.message
        });
    }
};