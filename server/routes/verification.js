import express from 'express';
import { secureRoute } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/checkAdmin.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { sanitizeFilename } from '../utils/fileSecurity.js';
import { validateUploadedImages } from '../middleware/imageValidation.js';
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

// ES6 __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer cho upload ảnh CCCD
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename để tránh path traversal
        const sanitized = sanitizeFilename(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(sanitized);
        cb(null, 'cccd-' + uniqueSuffix + ext);
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
// Validate images: magic bytes, dimensions, content
verificationRouter.post('/identity-card',
    secureRoute,
    upload.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
        { name: 'selfieImage', maxCount: 1 }
    ]),
    validateUploadedImages,
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

