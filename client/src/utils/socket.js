import { io } from 'socket.io-client';
import { env } from '../config/env.js';

const SOCKET_URL = env.API_URL;

// Create socket connection
// Note: Socket auth is currently disabled on server for development
// TODO: Implement proper authentication when needed
const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message || error);
});

export default socket;
