import fs from 'fs';
import path from 'path';

/**
 * Magic bytes (file signatures) cho các định dạng ảnh phổ biến
 * Format: [signature bytes, mime type, extension]
 */
const IMAGE_SIGNATURES = {
    // JPEG: FF D8 FF
    jpeg: [
        [[0xFF, 0xD8, 0xFF], 'image/jpeg', '.jpg'],
        [[0xFF, 0xD8, 0xFF], 'image/jpeg', '.jpeg']
    ],
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    png: [
        [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 'image/png', '.png']
    ],
    // GIF: 47 49 46 38 (GIF8)
    gif: [
        [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], 'image/gif', '.gif'], // GIF87a
        [[0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 'image/gif', '.gif']  // GIF89a
    ],
    // WebP: RIFF....WEBP
    webp: [
        [[0x52, 0x49, 0x46, 0x46], 'image/webp', '.webp'] // RIFF header, need to check further
    ]
};

/**
 * Kiểm tra magic bytes của file để xác định loại file thực sự
 * @param {string} filePath - Đường dẫn đến file
 * @returns {Object|null} - { type: 'jpeg'|'png'|'gif'|'webp', mime: string, ext: string } hoặc null nếu không hợp lệ
 */
export const checkMagicBytes = (filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);

        if (buffer.length < 12) {
            if (process.env.NODE_ENV !== 'production') {
                console.debug('⚠️ File too small for magic bytes check:', filePath, 'size:', buffer.length);
            }
            return null; // File quá nhỏ, không hợp lệ
        }

        // Kiểm tra JPEG
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return { type: 'jpeg', mime: 'image/jpeg', ext: '.jpg' };
        }

        // Kiểm tra PNG
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
            buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
            return { type: 'png', mime: 'image/png', ext: '.png' };
        }

        // Kiểm tra GIF
        if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
            if ((buffer[4] === 0x37 && buffer[5] === 0x61) || // GIF87a
                (buffer[4] === 0x39 && buffer[5] === 0x61)) {  // GIF89a
                return { type: 'gif', mime: 'image/gif', ext: '.gif' };
            }
        }

        // Kiểm tra WebP (RIFF....WEBP)
        if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            // Kiểm tra xem có phải WebP không (bytes 8-11 phải là "WEBP")
            if (buffer.length >= 12 &&
                buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
                return { type: 'webp', mime: 'image/webp', ext: '.webp' };
            }
        }

        // Không khớp với bất kỳ định dạng nào
        if (process.env.NODE_ENV !== 'production') {
            const firstBytes = Array.from(buffer.slice(0, 8))
                .map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0'))
                .join(' ');
            console.debug('⚠️ Magic bytes check failed - no matching format:', {
                file: filePath,
                firstBytes: firstBytes
            });
        }
        return null;
    } catch (error) {
        console.error('❌ Error checking magic bytes:', error);
        return null;
    }
};

/**
 * Sanitize filename để tránh path traversal và các ký tự nguy hiểm
 * @param {string} filename - Tên file gốc
 * @returns {string} - Tên file đã được sanitize
 */
export const sanitizeFilename = (filename) => {
    if (!filename) {
        return 'file';
    }

    // Lấy extension an toàn
    const ext = path.extname(filename).toLowerCase();
    const safeExt = /^\.(jpg|jpeg|png|gif|webp)$/.test(ext) ? ext : '';

    // Loại bỏ path traversal và các ký tự nguy hiểm
    let sanitized = filename
        .replace(/^.*[\\\/]/, '') // Loại bỏ path
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Thay thế ký tự đặc biệt bằng underscore
        .replace(/_{2,}/g, '_') // Loại bỏ nhiều underscore liên tiếp
        .replace(/^_+|_+$/g, ''); // Loại bỏ underscore ở đầu và cuối

    // Giới hạn độ dài tên file (không tính extension)
    const nameWithoutExt = sanitized.replace(/\.[^/.]+$/, '');
    const maxLength = 100;
    if (nameWithoutExt.length > maxLength) {
        sanitized = nameWithoutExt.substring(0, maxLength) + safeExt;
    } else if (!sanitized.endsWith(safeExt)) {
        sanitized = sanitized + safeExt;
    }

    // Đảm bảo không rỗng
    if (!sanitized || sanitized === safeExt) {
        sanitized = 'image' + safeExt;
    }

    return sanitized;
};

/**
 * Kiểm tra kích thước ảnh (dimensions) để tránh DoS
 * Sử dụng thư viện image-size hoặc sharp nếu có, nếu không thì dùng cách đơn giản
 * @param {string} filePath - Đường dẫn đến file
 * @param {Object} options - { maxWidth: number, maxHeight: number, minWidth: number, minHeight: number }
 * @returns {Promise<Object>} - { valid: boolean, width: number, height: number, error?: string }
 */
export const validateImageDimensions = async (filePath, options = {}) => {
    const {
        maxWidth = 10000,  // 10k pixels - đủ lớn cho hầu hết trường hợp
        maxHeight = 10000,
        minWidth = 1,
        minHeight = 1
    } = options;

    try {
        // Thử sử dụng sharp nếu có
        try {
            const sharpModule = await import('sharp');
            const sharp = sharpModule.default;

            // Sharp cần được gọi với filePath, sau đó gọi metadata()
            const metadata = await sharp(filePath).metadata();

            const { width, height } = metadata;

            if (width < minWidth || height < minHeight) {
                return {
                    valid: false,
                    width,
                    height,
                    error: `Image dimensions too small. Minimum: ${minWidth}x${minHeight}, got: ${width}x${height}`
                };
            }

            if (width > maxWidth || height > maxHeight) {
                return {
                    valid: false,
                    width,
                    height,
                    error: `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}, got: ${width}x${height}`
                };
            }

            return { valid: true, width, height };
        } catch (sharpError) {
            // Log lỗi sharp để debug (chỉ trong development)
            if (process.env.NODE_ENV !== 'production') {
                console.debug('Sharp validation failed, trying image-size:', sharpError.message);
            }

            // Nếu không có sharp, thử image-size
            try {
                const imageSizeModule = await import('image-size');
                // image-size có default export là function
                const sizeOf = imageSizeModule.default || imageSizeModule.imageSize || imageSizeModule;

                // image-size trong ES modules cần buffer, không phải file path
                const fileBuffer = fs.readFileSync(filePath);
                const dimensions = sizeOf(fileBuffer);

                if (!dimensions || !dimensions.width || !dimensions.height) {
                    throw new Error('Failed to get image dimensions');
                }

                const { width, height } = dimensions;

                if (width < minWidth || height < minHeight) {
                    return {
                        valid: false,
                        width,
                        height,
                        error: `Image dimensions too small. Minimum: ${minWidth}x${minHeight}, got: ${width}x${height}`
                    };
                }

                if (width > maxWidth || height > maxHeight) {
                    return {
                        valid: false,
                        width,
                        height,
                        error: `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}, got: ${width}x${height}`
                    };
                }

                return { valid: true, width, height };
            } catch (imageSizeError) {
                // Log lỗi image-size để debug
                if (process.env.NODE_ENV !== 'production') {
                    console.debug('Image-size validation failed:', imageSizeError.message);
                }

                // Nếu không có cả hai, dùng cách đơn giản: đọc một phần file để ước tính
                // Đây là fallback, không chính xác 100% nhưng tốt hơn không có gì
                console.warn('⚠️ Neither sharp nor image-size available. Using basic validation.');

                const stats = fs.statSync(filePath);
                const fileSize = stats.size;

                // Ước tính: nếu file quá lớn (>50MB) thì có thể là ảnh quá lớn
                // Nhưng không thể biết chính xác dimensions mà không có thư viện
                if (fileSize > 50 * 1024 * 1024) {
                    return {
                        valid: false,
                        width: null,
                        height: null,
                        error: 'Image file size suggests dimensions may be too large. Please install sharp or image-size for accurate validation.'
                    };
                }

                // Nếu không có thư viện, chấp nhận file (nhưng cảnh báo)
                console.warn('⚠️ Image dimension validation skipped. Install sharp or image-size for better security.');
                return { valid: true, width: null, height: null, warning: 'Dimension validation skipped' };
            }
        }
    } catch (error) {
        console.error('Error validating image dimensions:', error);
        return {
            valid: false,
            width: null,
            height: null,
            error: `Failed to validate image dimensions: ${error.message}`
        };
    }
};

/**
 * Kiểm tra nội dung ảnh có hợp lệ không
 * @param {string} filePath - Đường dẫn đến file
 * @returns {Promise<Object>} - { valid: boolean, error?: string }
 */
export const validateImageContent = async (filePath) => {
    try {
        // Kiểm tra magic bytes trước
        const magicBytesResult = checkMagicBytes(filePath);
        if (!magicBytesResult) {
            return {
                valid: false,
                error: 'File does not appear to be a valid image (magic bytes check failed)'
            };
        }

        // Kiểm tra file có thể đọc được không
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            return {
                valid: false,
                error: 'File is empty'
            };
        }

        // Thử đọc một phần file để đảm bảo không bị corrupt
        const buffer = fs.readFileSync(filePath);
        if (buffer.length < 100) {
            return {
                valid: false,
                error: 'File is too small to be a valid image'
            };
        }

        // Nếu có sharp, thử load ảnh để đảm bảo nó hợp lệ
        try {
            const sharpModule = await import('sharp');
            const sharp = sharpModule.default;
            await sharp(filePath).metadata();
            return { valid: true };
        } catch (sharpError) {
            // Nếu không có sharp hoặc lỗi, vẫn chấp nhận nếu magic bytes đúng
            // Vì magic bytes đã được kiểm tra ở trên
            return { valid: true, warning: 'Content validation limited without sharp library' };
        }
    } catch (error) {
        console.error('Error validating image content:', error);
        return {
            valid: false,
            error: `Failed to validate image content: ${error.message}`
        };
    }
};

/**
 * Validate file đầy đủ: magic bytes, dimensions, content
 * @param {string} filePath - Đường dẫn đến file
 * @param {Object} options - Options cho dimension validation
 * @returns {Promise<Object>} - { valid: boolean, errors: string[], warnings: string[] }
 */
export const validateImageFile = async (filePath, options = {}) => {
    const errors = [];
    const warnings = [];

    // 1. Kiểm tra magic bytes TRƯỚC (quan trọng nhất)
    const magicBytesResult = checkMagicBytes(filePath);
    if (!magicBytesResult) {
        errors.push('File magic bytes do not match any supported image format');
        // Nếu magic bytes fail, không cần kiểm tra tiếp (file không phải ảnh)
        return {
            valid: false,
            errors,
            warnings,
            metadata: null
        };
    }

    // 2. Kiểm tra dimensions (chỉ khi magic bytes pass)
    const dimensionResult = await validateImageDimensions(filePath, options);
    if (!dimensionResult.valid) {
        errors.push(dimensionResult.error);
    }
    if (dimensionResult.warning) {
        warnings.push(dimensionResult.warning);
    }

    // 3. Kiểm tra content (chỉ khi magic bytes pass)
    const contentResult = await validateImageContent(filePath);
    if (!contentResult.valid) {
        errors.push(contentResult.error);
    }
    if (contentResult.warning) {
        warnings.push(contentResult.warning);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
            type: magicBytesResult?.type,
            mime: magicBytesResult?.mime,
            ext: magicBytesResult?.ext,
            width: dimensionResult.width,
            height: dimensionResult.height
        }
    };
};

