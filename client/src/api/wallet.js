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
export const getTransactionHistory = async () => {
    try {
        const res = await axios.get('/wallet/transactions', { withCredentials: true });
        return res.data;
    } catch (error) {
        console.error("Error getting transactions", error.message);
        throw new Error(error.response?.data?.error || "Failed to get transactions");
    }
};

