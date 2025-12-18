import axios from "../utils/axiosConfig.js";

// Get current balance
export const getBalance = async () => {
    try {
        const res = await axios.get('/wallet/balance', { withCredentials: true });
        return res.data;
    } catch (error) {
        console.error("Error getting balance", error.message);
        throw new Error(error.response?.data?.error || "Failed to get balance");
    }
};

// Top up / Add money to wallet
export const topUp = async (data) => {
    try {
        const res = await axios.post('/wallet/topup', data, { withCredentials: true });
        return res.data;
    } catch (error) {
        console.error("Error topping up", error.message);
        throw new Error(error.response?.data?.error || "Failed to top up");
    }
};

// Withdraw money from wallet
export const withdraw = async (data) => {
    try {
        const res = await axios.post('/wallet/withdraw', data, { withCredentials: true });
        return res.data;
    } catch (error) {
        console.error("Error withdrawing", error.message);
        throw new Error(error.response?.data?.error || "Failed to withdraw");
    }
};

// Get transaction history
export const getTransactionHistory = async (params = {}) => {
    try {
        const { page = 1, limit = 50, days, type, status } = params;
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page);
        if (limit) queryParams.append('limit', limit);
        if (days) queryParams.append('days', days);
        if (type) queryParams.append('type', type);
        if (status) queryParams.append('status', status);

        const res = await axios.get(`/wallet/transactions?${queryParams.toString()}`, { withCredentials: true });
        return res.data;
    } catch (error) {
        console.error("Error getting transactions", error.message);
        throw new Error(error.response?.data?.error || "Failed to get transactions");
    }
};

