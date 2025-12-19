import Login from "../models/Login.js";
import User from "../models/user.js";
import Product from "../models/product.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";


export const handleGetUser = async (req, res) => {
    try {
        // findById returns the user directly (compatible with test mocks)
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Select only needed fields for response (include _id for frontend)
        const { _id, name, email, avatar, role, verification, phone, address, location } = user;

        // Get phone number from verification.phone.number (if verified) or fallback to user.phone
        const phoneNumber = verification?.phone?.number || phone || null;

        // Trả về trạng thái xác minh
        const verificationStatus = {
            isVerified: verification?.isVerified || false,
            phone: verification?.phone?.isVerified || false,
            email: verification?.email?.isVerified || false,
            identityCard: verification?.identityCard?.status || 'not_submitted'
        };

        res.json({
            user: {
                _id,
                name,
                email,
                avatar,
                role,
                verification: verificationStatus,
                phone: phoneNumber,
                address,
                location
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

export const handleChangePassword = async (req, res) => {
    try {
        // Ensure req.body exists
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: "Please enter all fields" });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Type validation - reject non-strings
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
            return res.status(400).json({ error: "Please enter all fields" });
        }

        // Trim and validate - reject empty or whitespace-only
        const trimmedCurrent = currentPassword.trim();
        const trimmedNew = newPassword.trim();
        const trimmedConfirm = confirmPassword.trim();

        if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
            return res.status(400).json({ error: "Please enter all fields" });
        }

        if (trimmedNew !== trimmedConfirm) {
            return res.status(400).json({ error: "New password and confirm password do not match." });
        }
        if (trimmedCurrent === trimmedNew) {
            return res.status(400).json({ error: "You can't reuse the old password." });
        }

        const userID = req.user.id;

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const isPasswordValid = await bcrypt.compare(trimmedCurrent, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(trimmedNew, 10);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
        return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
};

export const getLoginHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const logins = await Login.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $sort: { loginAt: -1 }
            },
            {
                $limit: 10
            }
        ]);

        const formatted = logins.map(login => {
            const date = new Date(login.loginAt);
            const formattedDate = date.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

            const location = [
                login.location?.city,
                login.location?.region,
                login.location?.country
            ].filter(Boolean).join(", ");

            return {
                id: login._id,
                dateTime: formattedDate,
                ipAddress: login.ipAddress || "Unknown",
                location: location || "Unknown",
                isp: login.location?.isp || "Unknown",
                device: getDeviceType(login.userAgent),
            };
        });

        res.status(200).json(formatted);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not fetch login logs"
        });
    }
};


function getDeviceType(userAgent = "") {
    userAgent = userAgent.toLowerCase();
    if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(userAgent)) return "Mobile";
    if (/tablet|ipad|android(?!.*mobile)/.test(userAgent)) return "Tablet";
    return "Desktop";
}

// Get favorite auctions (auctions user has liked)
export const getFavoriteAuctions = async (req, res) => {
    try {
        const userId = req.user.id;

        // Tìm tất cả auctions mà user đã like
        const favoriteAuctions = await Product.find({
            likes: userId
        })
            .populate('seller', 'name isActive')
            .sort({ createdAt: -1 }); // Mới nhất trước

        // Format dữ liệu giống như AuctionList
        const formattedAuctions = favoriteAuctions.map(auction => {
            const timeLeft = Math.max(0, new Date(auction.itemEndDate) - new Date());
            return {
                _id: auction._id,
                itemName: auction.itemName,
                itemDescription: auction.itemDescription,
                itemCategory: auction.itemCategory,
                itemPhoto: auction.itemPhoto,
                startingPrice: auction.startingPrice,
                currentPrice: auction.currentPrice,
                itemStartDate: auction.itemStartDate,
                itemEndDate: auction.itemEndDate,
                timeLeft: timeLeft,
                bids: auction.bids,
                likesCount: auction.likesCount,
                isLikedByUser: true, // User đã like nên luôn true
                sellerName: auction.seller?.name || 'Unknown',
                sellerActive: auction.seller?.isActive !== false
            };
        });

        res.status(200).json({
            success: true,
            count: formattedAuctions.length,
            auctions: formattedAuctions
        });

    } catch (error) {
        console.error('Error fetching favorite auctions:', error);
        res.status(500).json({
            success: false,
            message: "Could not fetch favorite auctions"
        });
    }
};

// Request account reactivation (for deactivated users)
export const requestReactivation = async (req, res) => {
    try {
        const { email, message } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Your account is already active'
            });
        }

        if (user.reactivationRequest?.requested) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a reactivation request. Please wait for admin approval.'
            });
        }

        // Save reactivation request (reset any previous rejection)
        user.reactivationRequest = {
            requested: true,
            requestedAt: new Date(),
            message: message || 'User requested account reactivation',
            rejected: false,
            rejectedAt: null,
            adminNote: null
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Reactivation request submitted successfully. An admin will review your request.'
        });

    } catch (error) {
        console.error('Error requesting reactivation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit reactivation request'
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, address, city, region, country } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (name && name.trim()) {
            user.name = name.trim();
        }

        if (address !== undefined) {
            user.address = address;
        }

        // Update location
        if (city !== undefined || region !== undefined || country !== undefined) {
            user.location = {
                city: city || user.location?.city || '',
                region: region || user.location?.region || '',
                country: country || user.location?.country || ''
            };
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                location: user.location,
                avatar: user.avatar,
                role: user.role,
                verification: {
                    isVerified: user.verification?.isVerified || false,
                    phone: user.verification?.phone?.isVerified || false,
                    email: user.verification?.email?.isVerified || false,
                    identityCard: user.verification?.identityCard?.status || 'not_submitted'
                }
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};