import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Yêu cầu mở khóa tài khoản
    reactivationRequest: {
        requested: { type: Boolean, default: false },
        requestedAt: { type: Date, default: null },
        message: { type: String, default: null }
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    location: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
        isp: { type: String }
    },
    signupAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    refreshToken: {
        type: String,
        default: null
    },
    // Số dư tài khoản
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    // Xác minh tài khoản
    verification: {
        // Trạng thái xác minh tổng thể
        isVerified: {
            type: Boolean,
            default: false
        },
        // Số điện thoại
        phone: {
            number: { type: String, default: null },
            isVerified: { type: Boolean, default: false },
            verifiedAt: { type: Date, default: null }
        },
        // Email
        email: {
            isVerified: { type: Boolean, default: false },
            verifiedAt: { type: Date, default: null },
            verificationToken: { type: String, default: null },
            tokenExpires: { type: Date, default: null }
        },
        // Căn cước công dân
        identityCard: {
            // Số CCCD đã được hash (SHA-256) - dùng để so sánh trùng lặp
            numberHash: { type: String, default: null },
            // Số CCCD đã mask (chỉ hiển thị 4 số cuối) - để hiển thị cho user/admin
            numberMasked: { type: String, default: null },
            fullName: { type: String, default: null }, // Họ tên trên CCCD
            dateOfBirth: { type: Date, default: null },
            gender: { type: String, enum: ['male', 'female', null], default: null },
            nationality: { type: String, default: 'Việt Nam' },
            placeOfOrigin: { type: String, default: null }, // Quê quán
            placeOfResidence: { type: String, default: null }, // Nơi thường trú
            issueDate: { type: Date, default: null }, // Ngày cấp
            expiryDate: { type: Date, default: null }, // Ngày hết hạn
            frontImage: { type: String, default: null }, // Ảnh mặt trước CCCD
            backImage: { type: String, default: null }, // Ảnh mặt sau CCCD
            selfieImage: { type: String, default: null }, // Ảnh selfie cầm CCCD
            status: {
                type: String,
                enum: ['not_submitted', 'pending', 'approved', 'rejected'],
                default: 'not_submitted'
            },
            rejectionReason: { type: String, default: null },
            submittedAt: { type: Date, default: null },
            verifiedAt: { type: Date, default: null },
            verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
        }
    },
}, { timestamps: true });

// Index để đảm bảo số điện thoại unique (chỉ khi có giá trị)
userSchema.index(
    { 'verification.phone.number': 1 },
    {
        unique: true,
        sparse: true,  // Cho phép nhiều null
        partialFilterExpression: { 'verification.phone.number': { $type: 'string' } }
    }
);

// Index để đảm bảo hash CCCD unique (chỉ khi có giá trị)
userSchema.index(
    { 'verification.identityCard.numberHash': 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { 'verification.identityCard.numberHash': { $type: 'string' } }
    }
);

const User = mongoose.model('User', userSchema);

export default User;