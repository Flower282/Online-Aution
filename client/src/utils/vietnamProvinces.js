// API từ https://open.oapi.vn/location

const API_BASE = 'https://34tinhthanh.com';

/**
 * Lấy tất cả tỉnh/thành phố
 */
export const getProvinces = async () => {
    try {
        const response = await fetch(`${API_BASE}/provinces?page=0&size=100`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching provinces:', error);
        return [];
    }
};

/**
 * Lấy quận/huyện theo id tỉnh
 */
export const getDistricts = async (provinceId) => {
    try {
        const response = await fetch(`${API_BASE}/districts/${provinceId}?page=0&size=100`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching districts:', error);
        return [];
    }
};

/**
 * Lấy phường/xã theo id quận
 */
export const getWards = async (districtId) => {
    try {
        const response = await fetch(`${API_BASE}/wards/${districtId}?page=0&size=100`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error fetching wards:', error);
        return [];
    }
};

/**
 * Tìm kiếm tỉnh thành theo tên
 */
export const searchProvinces = async (query) => {
    try {
        const response = await fetch(`${API_BASE}/provinces?page=0&size=30&query=${encodeURIComponent(query)}`);
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Error searching provinces:', error);
        return [];
    }
};

