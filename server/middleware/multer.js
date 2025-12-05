import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// multer-storage-cloudinary is a CommonJS package; require it and handle multiple export shapes
const pkg = require('multer-storage-cloudinary');
let CloudinaryStorage = pkg.CloudinaryStorage || pkg.default || pkg;
if (!CloudinaryStorage) {
    throw new Error('Could not load CloudinaryStorage from multer-storage-cloudinary');
}
import { v2 as cloudinary } from 'cloudinary';


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'auctions',
        format: async (req, file) => 'png',
        public_id: (req, file) => `${Date.now()}-${file.originalname}`,
    },
});

const upload = multer({ storage });

export default upload;