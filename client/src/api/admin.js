import axios from "../utils/axiosConfig.js";
import { env } from '../config/env.js';

const VITE_API = env.API;

// Get admin dashboard statistics
export const getAdminDashboard = async () => {
    try {
        const res = await axios.get(`${VITE_API}/admin/dashboard`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't load admin dashboard");
        throw new Error(error?.response?.data?.error || "Failed to load admin dashboard. Please try again.");
    }
};

// Get all users with pagination and filtering
export const getAllUsers = async (page = 1, search = '', role = 'all', limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
    try {
        const res = await axios.get(`${VITE_API}/admin/users`, {
            params: { page, search, role, limit, sortBy, sortOrder },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't load users");
        throw new Error(error?.response?.data?.error || "Failed to load users. Please try again.");
    }
};

// Update user role (future functionality)
export const updateUserRole = async (userId, newRole) => {
    try {
        const res = await axios.patch(`${VITE_API}/admin/users/${userId}/role`,
            { role: newRole },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't update user role");
        throw new Error(error?.response?.data?.error || "Failed to update user role. Please try again.");
    }
};

// Deactivate user (was delete)
export const deleteUser = async (userId) => {
    try {
        const res = await axios.delete(`${VITE_API}/admin/users/${userId}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't deactivate user");
        throw new Error(error?.response?.data?.error || "Failed to deactivate user. Please try again.");
    }
};

// Reactivate user
export const reactivateUser = async (userId) => {
    try {
        const res = await axios.patch(`${VITE_API}/admin/users/${userId}/reactivate`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't reactivate user");
        throw new Error(error?.response?.data?.error || "Failed to reactivate user. Please try again.");
    }
};

// Block/Unblock user (future functionality)
export const toggleUserStatus = async (userId, status) => {
    try {
        const res = await axios.patch(`${VITE_API}/admin/users/${userId}/status`,
            { status },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't update user status");
        throw new Error(error?.response?.data?.error || "Failed to update user status. Please try again.");
    }
};

// ==================== AUCTION APPROVAL SYSTEM ====================

// Get pending auctions
export const getPendingAuctions = async (page = 1, limit = 20) => {
    try {
        const res = await axios.get(`${VITE_API}/admin/auctions/pending`, {
            params: { page, limit },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't load pending auctions");
        throw new Error(error?.response?.data?.message || "Failed to load pending auctions. Please try again.");
    }
};

// Get all auctions with filters
export const getAllAuctions = async (page = 1, limit = 20, status = 'all', search = '') => {
    try {
        const res = await axios.get(`${VITE_API}/admin/auctions`, {
            params: { page, limit, status, search },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't load auctions");
        throw new Error(error?.response?.data?.message || "Failed to load auctions. Please try again.");
    }
};

// Approve auction
export const approveAuction = async (auctionId) => {
    try {
        const res = await axios.patch(`${VITE_API}/admin/auctions/${auctionId}/approve`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't approve auction");
        throw new Error(error?.response?.data?.message || "Failed to approve auction. Please try again.");
    }
};

// Reject auction
export const rejectAuction = async (auctionId, reason) => {
    try {
        const res = await axios.patch(`${VITE_API}/admin/auctions/${auctionId}/reject`,
            { reason },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't reject auction");
        throw new Error(error?.response?.data?.message || "Failed to reject auction. Please try again.");
    }
};