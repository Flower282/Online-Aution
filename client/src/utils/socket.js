import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api.js';

// Create socket connection
// Note: Socket auth is currently disabled on server for development
// TODO: Implement proper authentication when needed
const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false, // Changed to false to prevent auto-connection on import
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 10000,
    transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
});

// Track connection state
let isConnected = false;
let connectPromise = null;

socket.on('connect', () => {
    isConnected = true;
    console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
    isConnected = false;
    console.log('🔌 Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message || error);
});

// Helper function to ensure socket is connected before use
export const ensureSocketConnected = () => {
    if (isConnected) {
        return Promise.resolve();
    }

    if (connectPromise) {
        return connectPromise;
    }

    connectPromise = new Promise((resolve, reject) => {
        if (socket.connected) {
            isConnected = true;
            connectPromise = null;
            resolve();
            return;
        }

        const onConnect = () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            isConnected = true;
            connectPromise = null;
            resolve();
        };

        const onError = (error) => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            connectPromise = null;
            reject(error);
        };

        socket.once('connect', onConnect);
        socket.once('connect_error', onError);

        socket.connect();
    });

    return connectPromise;
};

// Helper function to safely disconnect
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
    isConnected = false;
    connectPromise = null;
};

export default socket;
