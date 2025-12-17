import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Track connection state to avoid duplicate connections
let isConnected = false;

export const connectDB = async () => {
    // If already connected, skip reconnection
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    // If connection is in progress, wait for it
    if (mongoose.connection.readyState === 2) {
        return;
    }

    try {
        // Configure mongoose to use connection pooling efficiently
        await mongoose.connect(process.env.MONGO_URL, {
            maxPoolSize: 10,        // Maximum number of connections in the pool
            minPoolSize: 2,         // Minimum number of connections
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log('✅ Connected to MongoDB');

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            console.log('❌ MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            isConnected = true;
        });

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        isConnected = false;
        throw error;
    }
}

// Helper to check if DB is connected
export const isDBConnected = () => {
    return isConnected && mongoose.connection.readyState === 1;
}