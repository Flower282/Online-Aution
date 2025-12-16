import axios from "axios";
import { env } from '../config/env.js';

const VITE_API = env.API;

export const sendMessage = async (formData) => {
    try {
        const res = await axios.post(`${VITE_API}/contact`,
            formData,
        )
        return res.data;
    } catch (error) {
        console.error(error?.response?.data?.error || "Something went wrong");
        throw new Error(error?.response?.data?.error || "Failed to send message. Please try again.");
    }
}