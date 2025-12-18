import axios from "../utils/axiosConfig.js";
import { API_ENDPOINTS } from '../config/api.js';

/**
 * Lấy trạng thái xác minh tài khoản
 */
export const getVerificationStatus = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.VERIFICATION.STATUS, {
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error getting verification status:", error.message);
        throw new Error(error.response?.data?.error || "Failed to get verification status");
    }
};

/**
 * Xác minh số điện thoại
 */
export const verifyPhone = async (phoneNumber) => {
    try {
        const res = await axios.post(
            API_ENDPOINTS.VERIFICATION.PHONE,
            { phoneNumber },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error verifying phone:", error.message);
        throw new Error(error.response?.data?.error || "Failed to verify phone");
    }
};

/**
 * Gửi email xác minh
 */
export const sendVerificationEmail = async () => {
    try {
        const res = await axios.post(
            API_ENDPOINTS.VERIFICATION.EMAIL_SEND,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error sending verification email:", error.message);
        throw new Error(error.response?.data?.error || "Failed to send verification email");
    }
};

/**
 * Xác minh email qua token (public route)
 */
export const verifyEmailToken = async (token) => {
    try {
        // Encode token để đảm bảo URL encoding đúng
        const encodedToken = encodeURIComponent(token);
        const res = await axios.get(
            `${API_ENDPOINTS.VERIFICATION.EMAIL_VERIFY}?token=${encodedToken}`
        );
        return res.data;
    } catch (error) {
        console.error("Error verifying email token:", error.message);
        const errorMessage = error.response?.data?.error || "Failed to verify email";
        throw new Error(errorMessage);
    }
};

/**
 * Gửi thông tin CCCD để xác minh
 */
export const submitIdentityCard = async (formData) => {
    try {
        const res = await axios.post(
            API_ENDPOINTS.VERIFICATION.IDENTITY_CARD,
            formData,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error("Error submitting identity card:", error.message);
        throw new Error(error.response?.data?.error || "Failed to submit identity card");
    }
};

/**
 * Admin: Lấy danh sách users đang chờ xác minh
 */
export const getPendingVerifications = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.VERIFICATION.ADMIN_PENDING, {
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error("Error getting pending verifications:", error.message);
        throw new Error(error.response?.data?.error || "Failed to get pending verifications");
    }
};

/**
 * Admin: Lấy chi tiết xác minh của user
 */
export const getVerificationDetail = async (userId) => {
    try {
        const res = await axios.get(
            `${API_ENDPOINTS.VERIFICATION.STATUS.replace('/status', '')}/admin/${userId}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error getting verification detail:", error.message);
        throw new Error(error.response?.data?.error || "Failed to get verification detail");
    }
};

/**
 * Admin: Duyệt/Từ chối xác minh CCCD
 */
export const reviewIdentityCard = async (userId, action, rejectionReason = null) => {
    try {
        const res = await axios.post(
            `${API_ENDPOINTS.VERIFICATION.STATUS.replace('/status', '')}/admin/${userId}/review`,
            { action, rejectionReason },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error reviewing identity card:", error.message);
        throw new Error(error.response?.data?.error || "Failed to review identity card");
    }
};

