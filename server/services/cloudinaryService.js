import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (file) => {
    try {
        // Validate Cloudinary config
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('❌ Cloudinary configuration missing');
            throw new Error('Cloudinary configuration is missing. Please check environment variables.');
        }

        if (!file || !file.path) {
            throw new Error('Invalid file object provided');
        }

        console.log('📤 Uploading to Cloudinary:', {
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        });

        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'auctions',
            resource_type: 'auto', // Auto-detect image/video
        });

        console.log('✅ Cloudinary upload successful:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name
        });
        throw new Error(`Error uploading image to Cloudinary: ${error.message}`);
    }
};

export default uploadImage;   