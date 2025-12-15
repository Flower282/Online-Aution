import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
