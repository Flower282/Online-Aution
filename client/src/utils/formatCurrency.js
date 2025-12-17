/**
 * Format number as currency with 2 decimal places
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = '$') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return `${currency}0.00`;
    }
    return `${currency}${Number(amount).toFixed(2)}`;
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

