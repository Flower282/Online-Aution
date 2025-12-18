import User from "../models/user.js";
import uploadImage from "../services/cloudinaryService.js";
import fs from "fs";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/emailService.js";

// Secret key cho hash CCCD (trong production nên lưu vào .env)
const CCCD_HASH_SECRET = process.env.CCCD_HASH_SECRET || "auction-cccd-secret-key-2024";

// Hash số CCCD với SHA-256 + secret key
function hashCCCD(cccdNumber) {
    return crypto.createHmac("sha256", CCCD_HASH_SECRET).update(cccdNumber).digest("hex");
}

// Che số điện thoại (chỉ hiển thị 4 số cuối)
function maskPhone(phone) {
    if (!phone || phone.length < 4) return phone;
    return "*".repeat(phone.length - 4) + phone.slice(-4);
}

// Che số CCCD (chỉ hiển thị 4 số cuối)
function maskCCCD(cccd) {
    if (!cccd || cccd.length < 4) return cccd;
    return "*".repeat(cccd.length - 4) + cccd.slice(-4);
}

/**
 * Cập nhật trạng thái xác minh tổng thể
 * User được coi là đã xác minh khi cả 3 điều kiện được thỏa mãn:
 * - Phone verified
 * - Email verified
 * - Identity card approved
 */
function updateOverallVerification(user) {
    const phoneVerified = user.verification?.phone?.isVerified || false;
    const emailVerified = user.verification?.email?.isVerified || false;
    const identityVerified = user.verification?.identityCard?.status === "approved";

    if (!user.verification) user.verification = {};
    user.verification.isVerified = phoneVerified && emailVerified && identityVerified;
}

/**
 * Lấy trạng thái xác minh của user hiện tại
 */
export const getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("verification email");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const verification = user.verification || {};

        res.status(200).json({
            isVerified: verification.isVerified || false,
            phone: {
                number: verification.phone?.number ? maskPhone(verification.phone.number) : null,
                isVerified: verification.phone?.isVerified || false,
                verifiedAt: verification.phone?.verifiedAt,
            },
            email: {
                address: user.email,
                isVerified: verification.email?.isVerified || false,
                verifiedAt: verification.email?.verifiedAt,
            },
            identityCard: {
                number: verification.identityCard?.numberMasked || null,
                fullName: verification.identityCard?.fullName,
                status: verification.identityCard?.status || "not_submitted",
                rejectionReason: verification.identityCard?.rejectionReason,
                submittedAt: verification.identityCard?.submittedAt,
                verifiedAt: verification.identityCard?.verifiedAt,
            },
        });
    } catch (error) {
        console.error("Error getting verification status:", error);
        res
            .status(500)
            .json({ error: "Failed to get verification status", details: error.message });
    }
};

/**
 * Xác minh số điện thoại
 */
export const verifyPhone = async (req, res) => {
    try {
        const userId = req.user.id;
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        // Validate phone number format (Vietnam)
        const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
        const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, "");

        if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({
                error: "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.",
            });
        }

        // Chuẩn hóa số điện thoại
        let normalizedPhone = cleanPhone;
        if (normalizedPhone.startsWith("+84")) {
            normalizedPhone = "0" + normalizedPhone.slice(3);
        } else if (normalizedPhone.startsWith("84")) {
            normalizedPhone = "0" + normalizedPhone.slice(2);
        }

        // Kiểm tra số điện thoại đã được sử dụng chưa
        const existingUser = await User.findOne({
            _id: { $ne: userId },
            "verification.phone.number": normalizedPhone,
        });

        if (existingUser) {
            return res
                .status(400)
                .json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." });
        }

        const user = await User.findById(userId);
        if (!user.verification) user.verification = {};
        if (!user.verification.phone) user.verification.phone = {};

        user.verification.phone.number = normalizedPhone;
        user.verification.phone.isVerified = true;
        user.verification.phone.verifiedAt = new Date();

        updateOverallVerification(user);
        await user.save();

        res.status(200).json({
            message: "Số điện thoại đã được xác minh thành công",
            phone: {
                number: maskPhone(normalizedPhone),
                isVerified: true,
                verifiedAt: user.verification.phone.verifiedAt,
            },
            isVerified: user.verification.isVerified,
        });
    } catch (error) {
        console.error("Error verifying phone:", error);
        res.status(500).json({ error: "Failed to verify phone", details: error.message });
    }
};

/**
 * Gửi email xác minh (thật) – tạo token + gửi mail
 * Frontend gọi endpoint này khi người dùng nhấn nút "Gửi email xác minh"
 */
export const sendVerificationEmailRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.verification) user.verification = {};
        if (!user.verification.email) user.verification.email = {};

        if (user.verification.email.isVerified) {
            return res.status(400).json({
                error: "Email đã được xác minh rồi",
                email: {
                    address: user.email,
                    isVerified: true,
                },
            });
        }

        // Tạo token xác minh (24h)
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24);

        user.verification.email.verificationToken = verificationToken;
        user.verification.email.tokenExpires = tokenExpires;
        await user.save();

        // Gửi email xác minh
        await sendVerificationEmail(user.email, verificationToken, user.name);

        return res.status(200).json({
            message:
                "Email xác minh đã được gửi. Vui lòng kiểm tra hộp thư (kể cả spam) và nhấp vào liên kết để xác minh.",
            email: user.email,
        });
    } catch (error) {
        console.error("Error in sendVerificationEmailRequest:", error);
        return res.status(500).json({
            error: "Không thể gửi email xác minh. Vui lòng thử lại sau.",
            details: error.message,
        });
    }
};

/**
 * Xác minh email qua token (public)
 * Được gọi bởi trang /verify-email?token=...
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "Token xác minh không hợp lệ" });
        }

        const decodedToken = decodeURIComponent(token).trim();

        // Tìm user theo token
        const user = await User.findOne({
            "verification.email.verificationToken": decodedToken,
        });

        if (!user) {
            return res
                .status(400)
                .json({ error: "Token xác minh không hợp lệ hoặc đã được sử dụng." });
        }

        const tokenExpires = user.verification?.email?.tokenExpires;
        if (!tokenExpires || new Date() > tokenExpires) {
            // Xóa token hết hạn
            user.verification.email.verificationToken = null;
            user.verification.email.tokenExpires = null;
            await user.save();

            return res.status(400).json({
                error: "Token xác minh đã hết hạn. Vui lòng gửi lại yêu cầu xác minh email.",
            });
        }

        // Đánh dấu email đã xác minh
        user.verification.email.isVerified = true;
        user.verification.email.verifiedAt = new Date();
        user.verification.email.verificationToken = null;
        user.verification.email.tokenExpires = null;

        updateOverallVerification(user);
        await user.save();

        return res.status(200).json({
            message: "Email đã được xác minh thành công",
            email: {
                address: user.email,
                isVerified: true,
                verifiedAt: user.verification.email.verifiedAt,
            },
            isVerified: user.verification.isVerified,
        });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ error: "Failed to verify email", details: error.message });
    }
};

/**
 * Gửi thông tin CCCD để xác minh
 * Số CCCD được hash trước khi lưu - không ai có thể xem số gốc
 */
export const submitIdentityCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            number,
            fullName,
            dateOfBirth,
            gender,
            placeOfOrigin,
            placeOfResidence,
            issueDate,
            expiryDate,
        } = req.body;

        if (!number || !fullName || !dateOfBirth) {
            return res.status(400).json({
                error: "Vui lòng cung cấp đầy đủ thông tin: Số CCCD, họ tên, ngày sinh",
            });
        }

        if (!/^\d{12}$/.test(number)) {
            return res.status(400).json({ error: "Số CCCD phải gồm 12 chữ số" });
        }

        const cccdHash = hashCCCD(number);

        // Kiểm tra CCCD đã được sử dụng chưa (so sánh bằng hash)
        const existingUser = await User.findOne({
            _id: { $ne: userId },
            "verification.identityCard.numberHash": cccdHash,
            "verification.identityCard.status": "approved",
        });

        if (existingUser) {
            return res
                .status(400)
                .json({ error: "Số CCCD này đã được xác minh bởi tài khoản khác." });
        }

        const user = await User.findById(userId);
        if (!user.verification) user.verification = {};
        if (!user.verification.identityCard) user.verification.identityCard = {};

        // Upload ảnh nếu có
        let frontImageUrl = user.verification.identityCard.frontImage;
        let backImageUrl = user.verification.identityCard.backImage;
        let selfieImageUrl = user.verification.identityCard.selfieImage;

        if (req.files) {
            try {
                if (req.files.frontImage) {
                    frontImageUrl = await uploadImage(req.files.frontImage[0]);
                    fs.unlinkSync(req.files.frontImage[0].path);
                }
                if (req.files.backImage) {
                    backImageUrl = await uploadImage(req.files.backImage[0]);
                    fs.unlinkSync(req.files.backImage[0].path);
                }
                if (req.files.selfieImage) {
                    selfieImageUrl = await uploadImage(req.files.selfieImage[0]);
                    fs.unlinkSync(req.files.selfieImage[0].path);
                }
            } catch (uploadError) {
                console.error("Error uploading images:", uploadError);
                if (req.files) {
                    Object.values(req.files).forEach((files) => {
                        files.forEach((file) => {
                            try {
                                fs.unlinkSync(file.path);
                            } catch (e) { }
                        });
                    });
                }
                return res.status(500).json({ error: "Lỗi khi tải ảnh lên" });
            }
        }

        const maskedNumber = maskCCCD(number);

        user.verification.identityCard = {
            numberHash: cccdHash,
            numberMasked: maskedNumber,
            fullName,
            dateOfBirth: new Date(dateOfBirth),
            gender: gender || null,
            placeOfOrigin: placeOfOrigin || null,
            placeOfResidence: placeOfResidence || null,
            issueDate: issueDate ? new Date(issueDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            frontImage: frontImageUrl,
            backImage: backImageUrl,
            selfieImage: selfieImageUrl,
            status: "pending",
            rejectionReason: null,
            submittedAt: new Date(),
            verifiedAt: null,
            verifiedBy: null,
        };

        await user.save();

        res.status(200).json({
            message: "Thông tin CCCD đã được gửi và đang chờ xác minh",
            identityCard: {
                number: maskedNumber,
                fullName,
                status: "pending",
                submittedAt: user.verification.identityCard.submittedAt,
            },
        });
    } catch (error) {
        console.error("Error submitting identity card:", error);
        res
            .status(500)
            .json({ error: "Failed to submit identity card", details: error.message });
    }
};

/**
 * Admin: Duyệt/Từ chối xác minh CCCD
 */
export const reviewIdentityCard = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action, rejectionReason } = req.body;
        const adminId = req.user.id;

        if (!["approve", "reject"].includes(action)) {
            return res
                .status(400)
                .json({ error: 'Invalid action. Use "approve" or "reject"' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (
            !user.verification?.identityCard ||
            user.verification.identityCard.status !== "pending"
        ) {
            return res.status(400).json({
                error: "No pending identity card verification for this user",
            });
        }

        if (action === "approve") {
            user.verification.identityCard.status = "approved";
            user.verification.identityCard.verifiedAt = new Date();
            user.verification.identityCard.verifiedBy = adminId;
            user.verification.identityCard.rejectionReason = null;
            updateOverallVerification(user);
        } else {
            if (!rejectionReason) {
                return res.status(400).json({ error: "Rejection reason is required" });
            }
            user.verification.identityCard.status = "rejected";
            user.verification.identityCard.rejectionReason = rejectionReason;
        }

        await user.save();

        res.status(200).json({
            message:
                action === "approve"
                    ? "CCCD đã được phê duyệt"
                    : "CCCD đã bị từ chối",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                identityCard: {
                    status: user.verification.identityCard.status,
                    verifiedAt: user.verification.identityCard.verifiedAt,
                    rejectionReason: user.verification.identityCard.rejectionReason,
                },
                isVerified: user.verification.isVerified,
            },
        });
    } catch (error) {
        console.error("Error reviewing identity card:", error);
        res.status(500).json({
            error: "Failed to review identity card",
            details: error.message,
        });
    }
};

/**
 * Admin: Lấy danh sách users đang chờ xác minh CCCD
 */
export const getPendingVerifications = async (req, res) => {
    try {
        const users = await User.find({
            "verification.identityCard.status": "pending",
        }).select("name email avatar verification.identityCard createdAt");

        const formatted = users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            identityCard: {
                number: user.verification.identityCard.numberMasked || "********xxxx",
                fullName: user.verification.identityCard.fullName,
                dateOfBirth: user.verification.identityCard.dateOfBirth,
                gender: user.verification.identityCard.gender,
                placeOfOrigin: user.verification.identityCard.placeOfOrigin,
                placeOfResidence: user.verification.identityCard.placeOfResidence,
                frontImage: user.verification.identityCard.frontImage,
                backImage: user.verification.identityCard.backImage,
                selfieImage: user.verification.identityCard.selfieImage,
                submittedAt: user.verification.identityCard.submittedAt,
            },
            createdAt: user.createdAt,
        }));

        res.status(200).json({
            count: formatted.length,
            users: formatted,
        });
    } catch (error) {
        console.error("Error getting pending verifications:", error);
        res.status(500).json({
            error: "Failed to get pending verifications",
            details: error.message,
        });
    }
};

/**
 * Admin: Lấy chi tiết thông tin xác minh của user
 */
export const getVerificationDetail = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select(
            "name email avatar verification createdAt",
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const safeVerification = {
            isVerified: user.verification?.isVerified || false,
            phone: user.verification?.phone,
            email: user.verification?.email,
            identityCard: user.verification?.identityCard
                ? {
                    number: user.verification.identityCard.numberMasked || "********xxxx",
                    fullName: user.verification.identityCard.fullName,
                    dateOfBirth: user.verification.identityCard.dateOfBirth,
                    gender: user.verification.identityCard.gender,
                    placeOfOrigin: user.verification.identityCard.placeOfOrigin,
                    placeOfResidence: user.verification.identityCard.placeOfResidence,
                    issueDate: user.verification.identityCard.issueDate,
                    expiryDate: user.verification.identityCard.expiryDate,
                    frontImage: user.verification.identityCard.frontImage,
                    backImage: user.verification.identityCard.backImage,
                    selfieImage: user.verification.identityCard.selfieImage,
                    status: user.verification.identityCard.status,
                    rejectionReason: user.verification.identityCard.rejectionReason,
                    submittedAt: user.verification.identityCard.submittedAt,
                    verifiedAt: user.verification.identityCard.verifiedAt,
                }
                : null,
        };

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            verification: safeVerification,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Error getting verification detail:", error);
        res.status(500).json({
            error: "Failed to get verification detail",
            details: error.message,
        });
    }
};

/**
 * Kiểm tra user đã xác minh chưa (dùng cho các controller khác)
 */
export const isUserVerified = async (userId) => {
    try {
        const user = await User.findById(userId).select("verification.isVerified");
        return user?.verification?.isVerified || false;
    } catch (error) {
        console.error("Error checking user verification:", error);
        return false;
    }
};

/**
 * Middleware kiểm tra xác minh
 */
export const requireVerification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("verification");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.verification?.isVerified) {
            return res.status(403).json({
                error: "Tài khoản chưa được xác minh",
                code: "VERIFICATION_REQUIRED",
                verificationStatus: {
                    isVerified: false,
                    phone: user.verification?.phone?.isVerified || false,
                    email: user.verification?.email?.isVerified || false,
                    identityCard: user.verification?.identityCard?.status || "not_submitted",
                },
            });
        }

        next();
    } catch (error) {
        console.error("Error checking verification:", error);
        res.status(500).json({ error: "Failed to check verification status" });
    }
};


