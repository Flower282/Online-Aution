import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
dotenv.config();
import { connectDB } from './connection.js'
import auctionRouter from './routes/auction.js';
import depositRouter from './routes/deposit.js';
import walletRouter from './routes/wallet.js';
import { secureRoute } from './middleware/auth.js';
import userAuthRouter from './routes/userAuth.js';
import userRouter from './routes/user.js';
import contactRouter from "./routes/contact.js";
import adminRouter from './routes/admin.js';
import verificationRouter from './routes/verification.js';
import handleAuctionSocket from './socket/auction.socket.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';

const port = process.env.PORT || 4000;

connectDB();

const app = express();
const httpServer = createServer(app);

// ==================== SOCKET.IO ====================
// Cấu hình Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// TODO: Implement proper socket authentication
// Currently disabled because app uses httpOnly cookies which can't be sent via socket auth
// Options:
// 1. Store accessToken in localStorage and send via socket.auth
// 2. Implement socket authentication using session/cookies
// 3. Use a separate token specifically for socket connections

// TEMPORARY: Disabled socket auth for development
// io.use(socketAuthMiddleware);

// Handle authentication errors
io.engine.on("connection_error", (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error("Socket connection error:", err.code, err.message, err.context);
    }
});
// ==================== END SOCKET.IO ====================

// ==================== REDIS ====================
// Cấu hình Redis Client (Optional - for real-time bidding)
let redisClient = null;

if (process.env.REDIS_URL) {
    redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
            reconnectStrategy: false // Disable auto-reconnect
        }
    });

    redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
    redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
    redisClient.on('ready', () => console.log('✅ Redis Client Ready'));

    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Failed to connect to Redis:', error.message);
        console.log('⚠️  Redis disabled - Server will work without real-time features');
        redisClient = null;
    }
} else {
    console.log('ℹ️  Redis disabled - Set REDIS_URL in .env to enable real-time bidding');
}
// ==================== END REDIS ====================

// ==================== SOCKET & MONGODB LOGGER ====================
// MongoDB Logger cho bid history
if (!process.env.MONGO_URL) {
    console.error('❌ MONGO_URL not found in .env file');
    process.exit(1);
}

const mongoLogger = {
    logBid: async ({ auctionId, userId, amount, timestamp }) => {
        try {
            await connectDB();
            const Product = (await import('./models/product.js')).default;
            const product = await Product.findById(auctionId);
            if (product) {
                product.bids.push({
                    bidder: userId,
                    bidAmount: amount,
                    bidTime: timestamp
                });
                product.currentPrice = amount;
                await product.save();
                console.log(`✅ Bid logged to MongoDB: ${userId} bid ${amount} on auction ${auctionId}`);
            } else {
                console.warn(`⚠️  Auction ${auctionId} not found in MongoDB`);
            }
        } catch (error) {
            console.error('❌ MongoDB logging error:', error);
        }
    }
};

// Socket.io connection handler
io.on('connection', (socket) => {
    // Note: socket.user is undefined when auth middleware is disabled
    if (process.env.NODE_ENV !== 'production') {
        const userId = socket.user?.id || 'anonymous';
        console.log(`✅ Socket connected: ${socket.id} (User: ${userId})`);
    }

    handleAuctionSocket(socket, io, { redisClient, mongoLogger });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`❌ Socket disconnected: ${socket.id} (Reason: ${reason})`);
        }
    });
});

// Export io để sử dụng trong controllers
export { io };
// ==================== END SOCKET & MONGODB LOGGER ====================

app.use(cookieParser());

// Content-Type validation middleware - must be before express.json()
app.use((req, res, next) => {
    // Only validate POST, PUT, PATCH requests with body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        // Allow requests without Content-Type (supertest sets it automatically)
        // But reject explicitly wrong Content-Types
        // Skip validation for multipart/form-data (file uploads)
        if (contentType &&
            !contentType.includes('application/json') &&
            !contentType.includes('multipart/form-data')) {
            return res.status(400).json({ error: 'Content-Type must be application/json or multipart/form-data' });
        }
    }
    next();
});

app.use(express.json());

// Handle JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(err);
});

app.use(cors({
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));

// ==================== SOCKET MIDDLEWARE ====================
// Attach io to req để controllers có thể sử dụng
app.use((req, res, next) => {
    req.io = io;
    next();
});
// ==================== END SOCKET MIDDLEWARE ====================

app.get('/', async (req, res) => {
    res.json({ msg: 'Welcome to Online Auction System API' });
});
app.use('/auth', userAuthRouter)
app.use('/user', secureRoute, userRouter)
app.use('/auction', secureRoute, auctionRouter);
app.use('/deposit', secureRoute, depositRouter);
app.use('/wallet', secureRoute, walletRouter);
app.use('/contact', contactRouter);
app.use('/admin', secureRoute, adminRouter);
app.use('/verification', verificationRouter);

// Global Error Handler - must be after all routes
app.use((err, req, res, next) => {
    // Respect error.status if provided, default to 500
    const status = err.status || err.statusCode || 500;

    // Use error.message if available, otherwise generic message
    const message = err.message || 'Internal server error';

    // Send consistent JSON error format
    res.status(status).json({
        error: message,
        ...(err.details && { details: err.details })
    });
});

httpServer.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
    console.log(`✅ Socket.io enabled`);
    console.log(`✅ Wallet API enabled`);
    if (redisClient) {
        console.log(`✅ Redis enabled - Real-time bidding available`);
    } else {
        console.log(`ℹ️  Redis disabled - Standard bidding only`);
    }
});