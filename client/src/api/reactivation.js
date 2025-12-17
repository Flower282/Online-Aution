import axios from "../utils/axiosConfig.js";
import { API_ENDPOINTS } from '../config/api.js';

/**
 * Request account reactivation (public endpoint)
 */
export const requestAccountReactivation = async (email, message = '') => {
    try {
        const res = await axios.post(API_ENDPOINTS.AUTH.REQUEST_REACTIVATION, {
            email,
            message
        });
        return res.data;
    } catch (error) {
        console.error("Error requesting reactivation:", error);
        throw new Error(error.response?.data?.message || error.response?.data?.error || "Failed to submit reactivation request");
    }
};

