import crypto from 'crypto';
import querystring from 'querystring';

/**
 * VNPay Payment Gateway Integration
 * Secure payment gateway service with HMAC signature verification
 */

// Determine if using production or sandbox
const isProduction = process.env.NODE_ENV === 'production' && process.env.VNPAY_ENVIRONMENT === 'production';

const VNPAY_CONFIG = {
    // These should be in .env file
    tmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
    secretKey: process.env.VNPAY_SECRET_KEY || 'YOUR_SECRET_KEY',
    // Production URL: https://www.vnpayment.vn/paymentv2/vpcpay.html
    // Sandbox URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
    url: process.env.VNPAY_URL || (isProduction
        ? 'https://www.vnpayment.vn/paymentv2/vpcpay.html'
        : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    returnUrl: process.env.VNPAY_RETURN_URL || process.env.FRONTEND_URL + '/wallet/payment/callback',
    webhookUrl: process.env.VNPAY_WEBHOOK_URL || process.env.API_URL + '/api/wallet/payment/webhook',
    environment: isProduction ? 'production' : 'sandbox'
};

/**
 * Create secure payment URL for VNPay
 * @param {Object} params - Payment parameters
 * @param {Number} params.amount - Amount in VND
 * @param {String} params.orderId - Unique order ID
 * @param {String} params.orderDescription - Order description
 * @param {String} params.ipAddress - Customer IP address
 * @returns {String} Payment URL
 */
export const createVNPayPaymentUrl = (params) => {
    const { amount, orderId, orderDescription, ipAddress } = params;

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + '00';
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000) // 15 minutes
        .toISOString().replace(/[-:]/g, '').split('.')[0] + '00';

    const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_CONFIG.tmnCode,
        vnp_Amount: amount * 100, // VNPay expects amount in cents
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderDescription,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
        vnp_IpAddr: ipAddress,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate
    };

    // Sort params alphabetically for signature
    const sortedParams = Object.keys(vnp_Params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = vnp_Params[key];
            return acc;
        }, {});

    // Create query string
    const signData = querystring.stringify(sortedParams, { encode: false });

    // Create HMAC SHA512 signature
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.secretKey);
    hmac.update(signData, 'utf-8');
    const vnp_SecureHash = hmac.digest('hex');

    // Add signature to params
    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    // Build final URL
    const paymentUrl = VNPAY_CONFIG.url + '?' + querystring.stringify(vnp_Params, { encode: false });

    return paymentUrl;
};

/**
 * Verify VNPay callback signature
 * @param {Object} queryParams - Query parameters from callback
 * @returns {Object} { isValid: boolean, params: object }
 */
export const verifyVNPayCallback = (queryParams) => {
    try {
        const secureHash = queryParams.vnp_SecureHash;
        delete queryParams.vnp_SecureHash;
        delete queryParams.vnp_SecureHashType;

        // Sort params alphabetically
        const sortedParams = Object.keys(queryParams)
            .sort()
            .reduce((acc, key) => {
                if (queryParams[key] !== '') {
                    acc[key] = queryParams[key];
                }
                return acc;
            }, {});

        // Create query string
        const signData = querystring.stringify(sortedParams, { encode: false });

        // Verify HMAC signature
        const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.secretKey);
        hmac.update(signData, 'utf-8');
        const calculatedHash = hmac.digest('hex');

        const isValid = secureHash === calculatedHash;

        return {
            isValid,
            params: queryParams,
            responseCode: queryParams.vnp_ResponseCode,
            transactionStatus: queryParams.vnp_TransactionStatus,
            amount: parseInt(queryParams.vnp_Amount) / 100, // Convert back from cents
            orderId: queryParams.vnp_TxnRef,
            gatewayTransactionId: queryParams.vnp_TransactionNo
        };
    } catch (error) {
        console.error('Error verifying VNPay callback:', error);
        return {
            isValid: false,
            params: queryParams,
            error: error.message
        };
    }
};

/**
 * Generate unique order ID
 * @param {String} userId - User ID
 * @returns {String} Unique order ID
 */
export const generateOrderId = (userId) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `TOPUP_${userId}_${timestamp}_${random}`.toUpperCase();
};

/**
 * Generate idempotency key to prevent duplicate transactions
 * @param {String} userId - User ID
 * @param {Number} amount - Amount
 * @returns {String} Idempotency key
 */
export const generateIdempotencyKey = (userId, amount) => {
    const data = `${userId}_${amount}_${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
};

