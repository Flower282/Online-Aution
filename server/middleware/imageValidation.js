import { validateImageFile } from '../utils/fileSecurity.js';
import fs from 'fs';

/**
 * Middleware để validate ảnh sau khi multer đã lưu file
 * Kiểm tra magic bytes, dimensions, và content validation
 * Phải được đặt SAU multer middleware
 */
export const validateUploadedImage = async (req, res, next) => {
    // Chỉ validate nếu có file được upload
    if (!req.file) {
        return next(); // Không có file, để route handler xử lý
    }

    const filePath = req.file.path;

    try {
        // Validate file với các options
        const validationResult = await validateImageFile(filePath, {
            maxWidth: 10000,  // 10k pixels
            maxHeight: 10000,
            minWidth: 1,
            minHeight: 1
        });

        if (!validationResult.valid) {
            // Log lỗi validation
            console.error('❌ Image validation failed:', {
                filename: req.file.originalname,
                path: filePath,
                errors: validationResult.errors,
                warnings: validationResult.warnings
            });

            // Xóa file không hợp lệ
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Deleted invalid file:', req.file.filename);
                }
            } catch (unlinkError) {
                console.error('Error deleting invalid file:', unlinkError);
            }

            return res.status(400).json({
                error: 'Invalid image file',
                details: validationResult.errors,
                warnings: validationResult.warnings
            });
        }

        // Log warnings nếu có (nhưng vẫn cho phép upload)
        if (validationResult.warnings && validationResult.warnings.length > 0) {
            console.warn('⚠️ Image validation warnings:', validationResult.warnings);
        }

        // Log success
        console.log('✅ Image validation passed:', {
            filename: req.file.originalname,
            type: validationResult.metadata?.type,
            dimensions: validationResult.metadata?.width && validationResult.metadata?.height
                ? `${validationResult.metadata.width}x${validationResult.metadata.height}`
                : 'unknown'
        });

        // Lưu metadata vào req.file để sử dụng sau
        req.file.validationMetadata = validationResult.metadata;

        next();
    } catch (error) {
        // Xóa file nếu có lỗi trong quá trình validation
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (unlinkError) {
            console.error('Error deleting file after validation error:', unlinkError);
        }

        console.error('Error validating image:', error);
        return res.status(500).json({
            error: 'Failed to validate image file',
            details: error.message
        });
    }
};

/**
 * Middleware để validate nhiều ảnh (cho verification với fields)
 */
export const validateUploadedImages = async (req, res, next) => {
    // Chỉ validate nếu có files được upload
    if (!req.files) {
        return next();
    }

    const files = Object.values(req.files).flat(); // Flatten array of arrays
    const errors = [];
    const warnings = [];

    try {
        // Validate từng file
        for (const file of files) {
            if (!file || !file.path) continue;

            const validationResult = await validateImageFile(file.path, {
                maxWidth: 10000,
                maxHeight: 10000,
                minWidth: 1,
                minHeight: 1
            });

            if (!validationResult.valid) {
                // Log lỗi validation
                console.error('❌ Image validation failed:', {
                    field: file.fieldname,
                    filename: file.originalname,
                    path: file.path,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings
                });

                errors.push({
                    field: file.fieldname,
                    filename: file.originalname,
                    errors: validationResult.errors
                });

                // Xóa file không hợp lệ
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                        console.log('🗑️ Deleted invalid file:', file.filename);
                    }
                } catch (unlinkError) {
                    console.error('Error deleting invalid file:', unlinkError);
                }
            } else {
                if (validationResult.warnings && validationResult.warnings.length > 0) {
                    warnings.push({
                        field: file.fieldname,
                        filename: file.originalname,
                        warnings: validationResult.warnings
                    });
                }

                // Lưu metadata
                file.validationMetadata = validationResult.metadata;
            }
        }

        // Nếu có lỗi, xóa tất cả files và trả về lỗi
        if (errors.length > 0) {
            console.error('❌ Multiple image validation failed:', {
                totalFiles: files.length,
                failedFiles: errors.length,
                errors: errors
            });

            // Xóa tất cả files còn lại
            for (const file of files) {
                try {
                    if (file.path && fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                        console.log('🗑️ Deleted invalid file:', file.filename);
                    }
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }

            return res.status(400).json({
                error: 'Invalid image files',
                details: errors,
                warnings: warnings
            });
        }

        // Log warnings nếu có
        if (warnings.length > 0) {
            console.warn('⚠️ Image validation warnings:', warnings);
        }

        // Log success
        console.log('✅ All images validation passed:', {
            totalFiles: files.length,
            validatedFiles: files.filter(f => f.validationMetadata).length
        });

        next();
    } catch (error) {
        // Xóa tất cả files nếu có lỗi
        for (const file of files) {
            try {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }

        console.error('Error validating images:', error);
        return res.status(500).json({
            error: 'Failed to validate image files',
            details: error.message
        });
    }
};

