import axios from "../utils/axiosConfig.js";
import { API_ENDPOINTS } from '../config/api.js';

// ==================== PUBLIC APIs (No Auth Required) ====================

// Get all auctions (no authentication required - backend now allows GET without auth)
export const getPublicAuctions = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.AUCTION);
        return res.data;
    } catch (error) {
        console.error("Error on getting public auction data", error.message);
        throw new Error(error.response?.data?.message || "Failed to load auctions. Please try again.");
    }
}

// Get single auction by ID (no authentication required)
export const getPublicAuctionById = async (id) => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/${id}`);
        return res.data;
    } catch (error) {
        console.error("Error on getting public auction data", error.message);
        throw new Error(error.response?.data?.message || "Failed to load auction details. Please try again.");
    }
}

// ==================== AUTHENTICATED APIs ====================

// Get list of all auctions (with authentication for personalized data like isLiked)
export const getAuctions = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.AUCTION,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error on getting auction data", error.message);
        throw new Error(error.response?.data?.message || "Failed to load auctions. Please try again.");
    }
}

// getting list of user's auctions
export const getMyAuctions = async () => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/myauction`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error on getting my auction data", error.message);
        throw new Error(error.response?.data?.message || "Failed to load your auctions. Please try again.");
    }
}


// getting single auction using _id
export const viewAuction = async (id) => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/${id}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error on getting auction data", error.message);
        throw new Error(error.response?.data?.message || "Failed to load auction details. Please try again.");
    }
}

// placing bid for auction
export const placeBid = async ({ bidAmount, id }) => {
    try {
        const res = await axios.post(`${API_ENDPOINTS.AUCTION}/${id}`,
            { bidAmount },
            { withCredentials: true }
        )
        return res.data;
    } catch (error) {
        console.error("Error placing bid", error.message);
        throw new Error(error.response?.data?.message || "Failed to place bid. Please try again.");
    }
}


// creating new auction
export const createAuction = async (data) => {
    try {
        const formData = new FormData();
        formData.append("itemName", data.itemName);
        formData.append("startingPrice", data.startingPrice);
        formData.append("itemDescription", data.itemDescription);
        formData.append("itemCategory", data.itemCategory);
        formData.append("itemStartDate", data.itemStartDate);
        formData.append("itemEndDate", data.itemEndDate);
        formData.append("itemPhoto", data.itemPhoto);

        const res = await axios.post(API_ENDPOINTS.AUCTION,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            }
        );
        return res.data;
    } catch (error) {
        console.error("Error creating auction", error.message);
        throw new Error(error.response?.data?.message || "Failed to create auction. Please try again.");
    }
}

// getting dashboard statistics
export const dashboardStats = async () => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/stats`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error on getting dashboard data", error.message);
        throw new Error(error.response?.data?.message || "Failed to load dashboard data. Please try again.");
    }
}

// delete auction (Admin only)
export const deleteAuction = async (id) => {
    try {
        const res = await axios.delete(`${API_ENDPOINTS.AUCTION}/${id}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error deleting auction", error.message);
        throw new Error(error.response?.data?.message || "Failed to delete auction. Please try again.");
    }
}

// toggle like/unlike auction
export const toggleLikeAuction = async (id) => {
    try {
        const res = await axios.post(`${API_ENDPOINTS.AUCTION}/${id}/like`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error toggling like", error.message);
        throw new Error(error.response?.data?.message || "Failed to like auction. Please try again.");
    }
}

// get favorite auctions (auctions user has liked)
export const getFavoriteAuctions = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.USER_FAVORITES,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error getting favorite auctions", error.message);
        throw new Error(error.response?.data?.message || "Failed to load favorite auctions. Please try again.");
    }
}

// ==================== ADMIN FUNCTIONS ====================

// get all auctions for admin (including ended ones)
export const getAllAuctionsAdmin = async () => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/admin/all`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error getting all auctions for admin", error.message);
        throw new Error(error.response?.data?.message || "Failed to load auctions. Please try again.");
    }
}

// ==================== DEPOSIT FUNCTIONS ====================

// get won auctions (auctions user has won)
export const getWonAuctions = async () => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/won`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error getting won auctions", error.message);
        throw new Error(error.response?.data?.message || "Failed to load won auctions. Please try again.");
    }
}

// pay for a won auction
export const payForWonAuction = async (id) => {
    try {
        const res = await axios.post(`${API_ENDPOINTS.AUCTION}/${id}/pay`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error paying for won auction", error.message);
        throw new Error(error.response?.data?.error || error.response?.data?.message || "Failed to pay for auction. Please try again.");
    }
}

// get deposit information for an auction
export const getDepositInfo = async (id) => {
    try {
        const res = await axios.get(`${API_ENDPOINTS.AUCTION}/${id}/deposit`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error getting deposit info", error.message);
        throw new Error(error.response?.data?.message || "Failed to load deposit information. Please try again.");
    }
}

// submit deposit payment
export const submitDeposit = async (id, depositData) => {
    try {
        const res = await axios.post(`${API_ENDPOINTS.AUCTION}/${id}/deposit`,
            depositData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error submitting deposit", error.message);
        throw new Error(error.response?.data?.message || "Failed to submit deposit. Please try again.");
    }
}

// finalize auction (set winner and deposit requirements)
export const finalizeAuction = async (id) => {
    try {
        const res = await axios.post(`${API_ENDPOINTS.AUCTION}/${id}/finalize`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error finalizing auction", error.message);
        throw new Error(error.response?.data?.error || error.response?.data?.message || "Failed to finalize auction. Please try again.");
    }
}

// ==================== PRE-BID DEPOSIT FUNCTIONS ====================

// Check deposit status for an auction (required before bidding)
export const checkDeposit = async (productId) => {
    try {
        const res = await axios.get(`/deposit/${productId}/check`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error checking deposit", error.message);
        throw new Error(error.response?.data?.message || "Failed to check deposit status.");
    }
}

// Create/submit deposit before bidding
export const createDeposit = async (productId, depositData) => {
    try {
        const res = await axios.post(`/deposit/${productId}`,
            depositData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error creating deposit", error.message);
        throw new Error(error.response?.data?.error || error.response?.data?.message || "Failed to submit deposit.");
    }
}

// Get all deposits for current user
export const getMyDeposits = async () => {
    try {
        const res = await axios.get('/deposit/my-deposits',
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error getting my deposits", error.message);
        throw new Error(error.response?.data?.message || "Failed to load deposits.");
    }
}