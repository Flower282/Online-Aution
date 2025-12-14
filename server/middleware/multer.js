import multer from 'multer';
import multerCloudinary from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

const storage = new multerCloudinary({
    cloudinary: cloudinary,
    params: {
        folder: 'auctions',
        format: async (req, file) => 'png',
        public_id: (req, file) => `${Date.now()}-${file.originalname}`,
    },
});

const upload = multer({ storage });

export default upload;