import axios from "../utils/axiosConfig.js";
import { API_ENDPOINTS } from '../config/api.js';

// Get admin dashboard statistics
export const getAdminDashboard = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_DASHBOARD,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to load admin dashboard. Please try again.");
    }
};

// Get all users with pagination and filtering
export const getAllUsers = async (page = 1, search = '', role = 'all', limit = 10, sortBy = 'createdAt', sortOrder = 'desc') => {
    try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_USERS, {
            params: { page, search, role, limit, sortBy, sortOrder },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to load users. Please try again.");
    }
};

// Update user role (future functionality)
export const updateUserRole = async (userId, newRole) => {
    try {
        const res = await axios.patch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/role`,
            { role: newRole },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to update user role. Please try again.");
    }
};

// Deactivate user (was delete)
export const deleteUser = async (userId) => {
    try {
        const res = await axios.delete(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to deactivate user. Please try again.");
    }
};

// Reactivate user
export const reactivateUser = async (userId) => {
    try {
        const res = await axios.patch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/reactivate`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to reactivate user. Please try again.");
    }
};

// Get pending reactivation requests
export const getPendingReactivationRequests = async () => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.ADMIN_USERS}/reactivation-requests`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to load pending reactivation requests. Please try again.");
    }
};

// Block/Unblock user (future functionality)
export const toggleUserStatus = async (userId, status) => {
    try {
        const res = await axios.patch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/status`,
            { status },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to update user status. Please try again.");
    }
};

// ==================== AUCTION APPROVAL SYSTEM ====================

// Get pending auctions
export const getPendingAuctions = async (page = 1, limit = 20) => {
    try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_AUCTIONS_PENDING, {
            params: { page, limit },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.message || "Failed to load pending auctions. Please try again.");
    }
};

// Get all auctions with filters
export const getAllAuctions = async (page = 1, limit = 20, status = 'all', search = '') => {
    try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_AUCTIONS, {
            params: { page, limit, status, search },
            withCredentials: true
        });
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.message || "Failed to load auctions. Please try again.");
    }
};

// Approve auction
export const approveAuction = async (auctionId) => {
    try {
        const res = await axios.patch(`${API_ENDPOINTS.ADMIN_AUCTIONS}/${auctionId}/approve`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.message || "Failed to approve auction. Please try again.");
    }
};

// Reject auction
export const rejectAuction = async (auctionId, reason) => {
    try {
        const res = await axios.patch(`${API_ENDPOINTS.ADMIN_AUCTIONS}/${auctionId}/reject`,
            { reason },
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.message || "Failed to reject auction. Please try again.");
    }
};
