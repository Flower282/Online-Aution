import axios from "../utils/axiosConfig.js";
import { API_ENDPOINTS } from '../config/api.js';

export const changePassword = async (formData) => {
    try {
        const res = await axios.patch(API_ENDPOINTS.USER,
            formData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to update password. Please try again.");
    }
}


export const loginHistory = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.USER_LOGINS,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.error || "Failed to load login history. Please try again.");
    }
}

export const updateProfile = async (profileData) => {
    try {
        const res = await axios.put(`${API_ENDPOINTS.USER}/profile`,
            profileData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        throw new Error(error?.response?.data?.message || "Failed to update profile. Please try again.");
    }
}
