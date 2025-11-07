import { configureStore } from '@reduxjs/toolkit';
// USING TEST VERSION (no backend needed)
import authReducer from './auth/authSlice.test';
// import authReducer from './auth/authSlice'; // Use this when you have backend
// import auctionReducer from './auction/auctionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // auctions: auctionReducer,
    },
});
