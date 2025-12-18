import express from 'express';
import { secureRoute } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/checkAdmin.js';
import multer from 'multer';
import path from 'path';
import {
    getVerificationStatus,
    verifyPhone,
    verifyEmail,
    sendVerificationEmailRequest,
    submitIdentityCard,
    reviewIdentityCard,
    getPendingVerifications,
    getVerificationDetail
} from '../controllers/verification.controller.js';

const verificationRouter = express.Router();

// Cấu hình multer cho upload ảnh CCCD
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cccd-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG and WebP images are allowed'));
        }
    }
});

// ============ USER ROUTES ============

// Lấy trạng thái xác minh
verificationRouter.get('/status', secureRoute, getVerificationStatus);

// Xác minh số điện thoại
verificationRouter.post('/phone', secureRoute, verifyPhone);

// Gửi email xác minh
verificationRouter.post('/email/send', secureRoute, sendVerificationEmailRequest);

// Xác minh email qua token (public route - không cần auth)
verificationRouter.get('/email/verify', verifyEmail);

// Gửi thông tin CCCD
verificationRouter.post('/identity-card',
    secureRoute,
    upload.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
        { name: 'selfieImage', maxCount: 1 }
    ]),
    submitIdentityCard
);

// ============ ADMIN ROUTES ============

// Lấy danh sách users đang chờ xác minh
verificationRouter.get('/admin/pending', secureRoute, checkAdmin, getPendingVerifications);

// Lấy chi tiết xác minh của user
verificationRouter.get('/admin/:userId', secureRoute, checkAdmin, getVerificationDetail);

// Duyệt/Từ chối xác minh CCCD
verificationRouter.post('/admin/:userId/review', secureRoute, checkAdmin, reviewIdentityCard);

export default verificationRouter;

