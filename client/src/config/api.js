/**
 * API Configuration
 * 
 * Centralized API endpoint configuration.
 * Uses VITE_API_URL from environment variables.
 */
import { env } from './env.js';

const API_URL = env.API_URL;

export const API_ENDPOINTS = {
    // Base URL
    BASE: API_URL,

    // Auth endpoints
    AUTH: {
        LOGIN: `${API_URL}/auth/login`,
        SIGNUP: `${API_URL}/auth/signup`,
        LOGOUT: `${API_URL}/auth/logout`,
        REFRESH_TOKEN: `${API_URL}/auth/refresh-token`,
    },

    // User endpoints
    USER: `${API_URL}/user`,
    USER_FAVORITES: `${API_URL}/user/favorites`,
    USER_LOGINS: `${API_URL}/user/logins`,

    // Auction endpoints
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

