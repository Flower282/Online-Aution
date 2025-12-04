import axios from "axios";
const VITE_AUCTION_API = import.meta.env.VITE_AUCTION_API;


// getting list of all auction
export const getAuctions = async () => {
    try {
        const res = await axios.get(`${VITE_AUCTION_API}`,
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
        const res = await axios.get(`${VITE_AUCTION_API}/myauction`,
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
        const res = await axios.get(`${VITE_AUCTION_API}/${id}`,
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
        const res = await axios.post(`${VITE_AUCTION_API}/${id}`,
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

        const res = await axios.post(`${VITE_AUCTION_API}`,
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
        const res = await axios.get(`${VITE_AUCTION_API}/stats`,
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
        const res = await axios.delete(`${VITE_AUCTION_API}/${id}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        console.error("Error deleting auction", error.message);
        throw new Error(error.response?.data?.message || "Failed to delete auction. Please try again.");
    }
}