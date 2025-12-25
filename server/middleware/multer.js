import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { sanitizeFilename, checkMagicBytes } from '../utils/fileSecurity.js';

// ES6 __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory:', uploadsDir);
}

// Use disk storage - Cloudinary upload will happen in controller
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename để tránh path traversal
        const sanitized = sanitizeFilename(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sử dụng extension từ sanitized filename (đã được validate)
        const ext = path.extname(sanitized);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Kiểm tra extension và mimetype cơ bản
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (!mimetype || !extname) {
            return cb(new Error('Only image files are allowed!'));
        }

        // Lưu ý: Magic bytes sẽ được kiểm tra sau khi file được lưu vào disk
        // trong middleware validation (vì multer cần file path để đọc magic bytes)
        cb(null, true);
    }
});

console.log('✅ Multer disk storage configured');

export default upload;