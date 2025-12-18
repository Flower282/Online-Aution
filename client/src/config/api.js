/**
 * API Configuration
 * 
 * Centralized API endpoint configuration.
 * Only requires ONE environment variable: VITE_API
 */

const API_URL = import.meta.env.VITE_API || 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Base URL
    BASE: API_URL,

    // Auth endpoints
    AUTH: {
        LOGIN: `${API_URL}/auth/login`,
        SIGNUP: `${API_URL}/auth/signup`,
        LOGOUT: `${API_URL}/auth/logout`,
        REFRESH_TOKEN: `${API_URL}/auth/refresh-token`,
        REQUEST_REACTIVATION: `${API_URL}/auth/request-reactivation`,
    },

    // User endpoints
    USER: `${API_URL}/user`,
    USER_FAVORITES: `${API_URL}/user/favorites`,
    USER_LOGINS: `${API_URL}/user/logins`,

    // Public endpoints (no auth required)
    PUBLIC: {
        AUCTIONS: `${API_URL}/api/public/auctions`,
        AUCTION_BY_ID: (id) => `${API_URL}/api/public/auctions/${id}`,
    },

    // Auction endpoints (auth required)
    AUCTION: `${API_URL}/auction`,

    // Admin endpoints
    ADMIN: `${API_URL}/admin`,
    ADMIN_DASHBOARD: `${API_URL}/admin/dashboard`,
    ADMIN_USERS: `${API_URL}/admin/users`,
    ADMIN_AUCTIONS: `${API_URL}/admin/auctions`,
    ADMIN_AUCTIONS_PENDING: `${API_URL}/admin/auctions/pending`,

    // Contact endpoint
    CONTACT: `${API_URL}/contact`,

    // Verification endpoints
    VERIFICATION: {
        STATUS: `${API_URL}/verification/status`,
        PHONE: `${API_URL}/verification/phone`,
        EMAIL: `${API_URL}/verification/email`,
        IDENTITY_CARD: `${API_URL}/verification/identity-card`,
        ADMIN_PENDING: `${API_URL}/verification/admin/pending`,
    },
};

// Export base URL for socket connection
export const SOCKET_URL = API_URL;

// Freeze to prevent mutations
Object.freeze(API_ENDPOINTS);

export default API_ENDPOINTS;

