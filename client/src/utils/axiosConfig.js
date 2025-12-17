import axios from 'axios';
import { API_ENDPOINTS } from '../config/api.js';
import { env } from '../config/env.js';

// Configure Axios defaults for production authentication
axios.defaults.baseURL = env.API_URL;
axios.defaults.withCredentials = true; // Always send cookies with requests

let store;
let isRefreshing = false;
let failedQueue = [];
let isLoggingOut = false; // Prevent multiple logout attempts

// Function to set store reference (will be called from main.jsx)
export const injectStore = (_store) => {
    store = _store;
};

// Reset auth state flags (useful after successful login)
export const resetAuthFlags = () => {
    isRefreshing = false;
    isLoggingOut = false;
    failedQueue = [];
};

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor to handle token expiration and refresh
axios.interceptors.response.use(
    (response) => {
        // If request is successful, just return the response
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if error is due to expired token (401 Unauthorized)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            // Skip refresh for login, signup, and refresh-token endpoints
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/signup') ||
                originalRequest.url?.includes('/auth/refresh-token')) {
                return Promise.reject(error);
            }

            // If already logging out, just reject without retrying
            if (isLoggingOut) {
                return Promise.reject(error);
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axios(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                await axios.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {}, {
                    withCredentials: true
                });

                // Token refreshed successfully
                processQueue(null);
                isRefreshing = false;

                // Retry the original request
                return axios(originalRequest);

            } catch (refreshError) {
                // Refresh token also expired or invalid
                processQueue(refreshError, null);
                isRefreshing = false;

                // Only logout once, even if multiple requests fail
                if (!isLoggingOut) {
                    isLoggingOut = true;

                    // Dynamically import logout action
                    import('../store/auth/authSlice').then(({ logout }) => {
                        // Dispatch logout action first
                        if (store) {
                            store.dispatch(logout());
                        }

                        // Let React Router handle navigation through MainLayout
                        // No manual redirect needed - MainLayout will detect !user and navigate

                        // Reset the flag after 3 seconds to allow future logouts
                        setTimeout(() => {
                            isLoggingOut = false;
                        }, 3000);
                    });
                }

                return Promise.reject(refreshError);
            }
        }

        // Return the error for further handling
        return Promise.reject(error);
    }
);

export default axios;

