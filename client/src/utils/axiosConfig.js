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
            // Skip refresh for login, signup, refresh-token, and other auth endpoints
            const skipRefreshPaths = ['/auth/login', '/auth/signup', '/auth/refresh-token', '/auth/logout'];
            const shouldSkip = skipRefreshPaths.some(path => originalRequest.url?.includes(path));

            if (shouldSkip) {
                // Silently reject for auth endpoints to avoid console errors
                return Promise.reject(error);
            }

            // If already logging out, just reject without retrying
            if (isLoggingOut) {
                return Promise.reject(error);
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve,
                        reject: (err) => {
                            // Ensure error is properly handled
                            reject(err instanceof Error ? err : new Error(err?.message || 'Request failed'));
                        }
                    });
                }).then(() => {
                    return axios(originalRequest);
                }).catch((err) => {
                    // Ensure error is properly handled
                    return Promise.reject(err instanceof Error ? err : new Error(err?.message || 'Request failed'));
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const refreshResponse = await axios.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {}, {
                    withCredentials: true
                });

                // Token refreshed successfully
                // Update user state if refresh response contains user data
                if (refreshResponse.data?.user && store) {
                    try {
                        import('../store/auth/authSlice').then(({ setUser }) => {
                            // Update user state with refreshed user data
                            store.dispatch(setUser({ user: refreshResponse.data.user }));
                        }).catch(() => {
                            // Fallback: try to update directly
                            try {
                                store.dispatch({
                                    type: 'auth/setUser',
                                    payload: { user: refreshResponse.data.user }
                                });
                            } catch (e) {
                                console.warn('Failed to update user state after token refresh:', e);
                            }
                        });
                    } catch (updateError) {
                        console.warn('Failed to update user state after token refresh:', updateError);
                    }
                }

                // Process queued requests
                processQueue(null);
                isRefreshing = false;

                // Retry the original request with new token
                return axios(originalRequest);

            } catch (refreshError) {
                // Check if refresh token is truly expired or invalid
                const errorCode = refreshError.response?.data?.code;
                const isRefreshTokenExpired =
                    errorCode === 'REFRESH_TOKEN_EXPIRED' ||
                    errorCode === 'REFRESH_TOKEN_INVALID' ||
                    errorCode === 'REFRESH_TOKEN_REUSED' ||
                    errorCode === 'REFRESH_TOKEN_MISSING';

                // Only logout if refresh token is truly expired/invalid
                // Don't logout for network errors or temporary server issues
                if (isRefreshTokenExpired) {
                    // Refresh token expired or invalid - user needs to login again
                    processQueue(refreshError, null);
                    isRefreshing = false;

                    // Only logout once, even if multiple requests fail
                    if (!isLoggingOut) {
                        isLoggingOut = true;

                        // Dynamically import logout action and setUser
                        import('../store/auth/authSlice')
                            .then(({ setUser }) => {
                                // Clear user state WITHOUT setting isManualLogout flag
                                // This is token expiration, not manual logout
                                if (store) {
                                    store.dispatch(setUser(null));
                                }

                                // Let React Router handle navigation through MainLayout
                                // MainLayout will detect !user and navigate to /login

                                // Reset the flag after 3 seconds to allow future logouts
                                setTimeout(() => {
                                    isLoggingOut = false;
                                }, 3000);
                            })
                            .catch((importError) => {
                                // Handle import error gracefully
                                console.warn('Failed to import authSlice, using fallback:', importError);
                                if (store) {
                                    // Try to clear user state directly
                                    try {
                                        store.dispatch({ type: 'auth/setUser', payload: null });
                                    } catch (dispatchError) {
                                        console.error('Failed to dispatch setUser:', dispatchError);
                                    }
                                }
                                setTimeout(() => {
                                    isLoggingOut = false;
                                }, 3000);
                            });
                    }
                } else {
                    // Network error or temporary server issue - don't logout
                    // Just reject the request, user can retry
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    console.warn('Token refresh failed due to network/server error, not logging out:', refreshError.message);
                }

                return Promise.reject(refreshError);
            }
        }

        // Return the error for further handling
        return Promise.reject(error);
    }
);

export default axios;

