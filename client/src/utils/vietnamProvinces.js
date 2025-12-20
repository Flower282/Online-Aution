// API từ https://34tinhthanh.com

const API_BASE = 'https://34tinhthanh.com/api';

// Cache configuration
const CACHE_PREFIX = 'vietnam_provinces_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Cache helper functions
 */
const cache = {
    set: (key, data) => {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
        } catch (error) {
            // Silent error handling
        }
    },

    get: (key) => {
        try {
            const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is expired
            if (now - cacheData.timestamp > CACHE_EXPIRY) {
                localStorage.removeItem(`${CACHE_PREFIX}${key}`);
                return null;
            }

            return cacheData.data;
        } catch (error) {
            return null;
        }
    },

    clear: (key) => {
        try {
            if (key) {
                localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            } else {
                // Clear all cache entries
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith(CACHE_PREFIX)) {
                        localStorage.removeItem(k);
                    }
                });
            }
        } catch (error) {
            // Silent error handling
        }
    }
};

/**
 * Lấy tất cả tỉnh/thành phố
 * Sử dụng cache để tránh gọi API nhiều lần
 */
export const getProvinces = async () => {
    const cacheKey = 'provinces';

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(`${API_BASE}/provinces`);
        const data = await response.json();

        // Map data to standard format
        const mapped = data.map(province => ({
            id: province.province_code,
            name: province.name
        }));

        // Save to cache
        cache.set(cacheKey, mapped);

        return mapped;
    } catch (error) {
        return [];
    }
};


/**
 * Lấy phường/xã theo province_code
 * Lưu ý: API này lấy TẤT CẢ phường/xã của tỉnh, không theo quận/huyện
 * Sử dụng cache để tránh gọi API nhiều lần
 */
export const getWards = async (provinceCode) => {
    if (!provinceCode) return [];

    const cacheKey = `wards_${provinceCode}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(`${API_BASE}/wards?province_code=${provinceCode}`);
        const data = await response.json();

        // Deduplicate wards by ward_code (some wards may have duplicate IDs)
        const uniqueWards = new Map();
        data.forEach(ward => {
            if (!uniqueWards.has(ward.ward_code)) {
                uniqueWards.set(ward.ward_code, {
                    id: ward.ward_code,
                    name: ward.ward_name
                });
            }
        });

        const mapped = Array.from(uniqueWards.values());

        // Save to cache
        cache.set(cacheKey, mapped);

        return mapped;
    } catch (error) {
        return [];
    }
};



/**
 * Tìm kiếm tỉnh thành theo tên (client-side filtering)
 * Sử dụng cache từ getProvinces
 */
export const searchProvinces = async (query) => {
    try {
        const provinces = await getProvinces(); // This will use cache if available
        if (!query) return provinces;

        const lowerQuery = query.toLowerCase();
        return provinces.filter(province =>
            province.name.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        return [];
    }
};

/**
 * Clear cache for provinces or wards
 * @param {string} key - 'provinces' or 'wards_{provinceCode}' or null to clear all
 */
export const clearCache = (key = null) => {
    cache.clear(key);
};

