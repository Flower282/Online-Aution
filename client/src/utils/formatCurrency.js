/**
 * Format number as currency in VND format
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string in VND
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0 VNĐ';
    }
    return `${Number(amount).toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Format number with 2 decimal places (without currency symbol)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0.00';
    }
    return Number(amount).toFixed(2);
};

export default formatCurrency;

