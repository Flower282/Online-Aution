import axios from "../utils/axiosConfig.js";
import { API_ENDPOINTS } from "../config/api.js";

/**
 * Gửi yêu cầu quên mật khẩu
 */
export const requestPasswordReset = async (email) => {
    try {
        const res = await axios.post(
            API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
            { email },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
};

/**
 * Đặt lại mật khẩu bằng token
 */
export const resetPasswordWithToken = async ({ token, newPassword }) => {
    try {
        const res = await axios.post(
            API_ENDPOINTS.AUTH.RESET_PASSWORD,
            { token, newPassword },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    }
};


