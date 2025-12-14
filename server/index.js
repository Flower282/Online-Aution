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
import { secureRoute } from './middleware/auth.js';
import userAuthRouter from './routes/userAuth.js';
import userRouter from './routes/user.js';
import contactRouter from "./routes/contact.js";
import adminRouter from './routes/admin.js';
import handleAuctionSocket from './socket/auction.socket.js';

const port = process.env.PORT || 4000;

connectDB();

const app = express();
const httpServer = createServer(app);

// Cấu hình Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Cấu hình Redis Client
if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not found in .env, using default: redis://localhost:6379');
}

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
redisClient.on('reconnecting', () => console.log('🔄 Redis Client Reconnecting...'));
redisClient.on('ready', () => console.log('✅ Redis Client Ready'));

try {
    await redisClient.connect();
} catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️  Server will start but auction bidding features will not work');
}

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
    console.log(`User connected: ${socket.id}`);
    handleAuctionSocket(socket, io, { redisClient, mongoLogger });
});

// Export io để sử dụng trong controllers
export { io };

app.use(cookieParser());

// Content-Type validation middleware - must be before express.json()
app.use((req, res, next) => {
    // Only validate POST, PUT, PATCH requests with body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        // Allow requests without Content-Type (supertest sets it automatically)
        // But reject explicitly wrong Content-Types
        if (contentType && !contentType.includes('application/json')) {
            return res.status(400).json({ error: 'Content-Type must be application/json' });
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

// Attach io to req để controllers có thể sử dụng
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.get('/', async (req, res) => {
    res.json({ msg: 'Welcome to Online Auction System API' });
});
app.use('/auth', userAuthRouter)
app.use('/user', secureRoute, userRouter)
app.use('/auction', secureRoute, auctionRouter);
app.use('/contact', contactRouter);
app.use('/admin', secureRoute, adminRouter)

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
    console.log(`Server is running on port ${port}`);
});