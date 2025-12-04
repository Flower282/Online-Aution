import axios from "axios";
const VITE_API = import.meta.env.VITE_API;

export const changePassword = async (formData) => {
    try {
        const res = await axios.patch(`${VITE_API}/user`,
            formData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't update password")
        throw new Error(error?.response?.data?.error || "Failed to update password. Please try again.");
    }
}


export const loginHistory = async () => {
    try {
        const res = await axios.get(`${VITE_API}/user/logins`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Can't show login history")
        throw new Error(error?.response?.data?.error || "Failed to load login history. Please try again.");
    }
}