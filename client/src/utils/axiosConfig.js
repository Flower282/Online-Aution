import axios from 'axios';
import { toast } from 'sonner';

const VITE_API = import.meta.env.VITE_API;

let store;
let isRefreshing = false;
let failedQueue = [];

// Function to set store reference (will be called from main.jsx)
export const injectStore = (_store) => {
    store = _store;
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
                await axios.post(`${VITE_API}/auth/refresh-token`, {}, {
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

                // Dynamically import logout action
                import('../store/auth/authSlice').then(({ logout }) => {
                    // Show notification
                    toast.error('Your session has expired. Please login again.', {
                        duration: 4000,
                        position: 'top-center',
                    });

                    // Dispatch logout action
                    if (store) {
                        store.dispatch(logout());
                    }

                    // Redirect to login page after a short delay
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                });

                return Promise.reject(refreshError);
            }
        }

        // Return the error for further handling
        return Promise.reject(error);
    }
);

export default axios;

