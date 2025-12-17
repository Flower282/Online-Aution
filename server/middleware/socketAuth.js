import { verifyToken } from "../utils/jwt.js";
import User from "../models/user.js";

/**
 * Socket.IO Authentication Middleware
 * 
 * Authenticates WebSocket connections using JWT access tokens
 * 
 * Token can be provided via:
 * 1. Query parameter: ?token=xxx (recommended for Socket.IO)
 * 2. Auth header: { auth: { token: 'xxx' } }
 * 
 * On authentication failure:
 * - Rejects connection with specific error code
 * - Client must refresh token and reconnect
 * 
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Callback to continue or reject connection
 */
export const socketAuthMiddleware = async (socket, next) => {
    try {
        // Extract token from query params or auth object
        // Query: io('url', { query: { token: 'xxx' } })
        // Auth: io('url', { auth: { token: 'xxx' } })
        const token = socket.handshake.query?.token || socket.handshake.auth?.token;

        // Case 1: No token provided
        if (!token) {
            const error = new Error("Authentication error");
            error.data = {
                code: "TOKEN_MISSING",
                message: "Access token not provided"
            };
            return next(error);
        }

        // Case 2: Verify access token
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            // Handle token expiration
            if (error.name === 'TokenExpiredError') {
                const authError = new Error("Authentication error");
                authError.data = {
                    code: "TOKEN_EXPIRED",
                    message: "Access token expired. Please refresh and reconnect."
                };
                return next(authError);
            }

            // Handle invalid token
            if (error.name === 'JsonWebTokenError') {
                const authError = new Error("Authentication error");
                authError.data = {
                    code: "TOKEN_INVALID",
                    message: "Invalid access token"
                };
                return next(authError);
            }

            // Handle not-yet-valid token
            if (error.name === 'NotBeforeError') {
                const authError = new Error("Authentication error");
                authError.data = {
                    code: "TOKEN_NOT_ACTIVE",
                    message: "Token not yet active"
                };
                return next(authError);
            }

            // Generic error
            const authError = new Error("Authentication error");
            authError.data = {
                code: "TOKEN_ERROR",
                message: "Failed to verify token"
            };
            return next(authError);
        }

        // Case 3: Validate user exists and is active (optional but recommended)
        const user = await User.findById(decoded.id).select('_id role isActive');

        if (!user) {
            const error = new Error("Authentication error");
            error.data = {
                code: "USER_NOT_FOUND",
                message: "User not found"
            };
            return next(error);
        }

        if (!user.isActive) {
            const error = new Error("Authentication error");
            error.data = {
                code: "USER_INACTIVE",
                message: "Account is inactive"
            };
            return next(error);
        }

        // Case 4: Authentication successful - attach user data to socket
        socket.user = {
            id: decoded.id,
            role: decoded.role
        };

        // Optional: Track socket connection by user
        socket.userId = decoded.id;

        // Log successful authentication (only in development)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Socket authenticated: User ${decoded.id} (${socket.id})`);
        }

        // Allow connection
        next();

    } catch (error) {
        // Handle unexpected errors
        if (process.env.NODE_ENV !== 'production') {
            console.error("Socket authentication error:", error);
        }

        const authError = new Error("Authentication error");
        authError.data = {
            code: "AUTHENTICATION_FAILED",
            message: "Authentication failed"
        };
        next(authError);
    }
};

/**
 * Optional: Middleware to require specific roles
 * Usage: socket.use(requireRole(['admin']))
 */
export const requireRole = (allowedRoles) => {
    return (socket, next) => {
        if (!socket.user) {
            const error = new Error("Authorization error");
            error.data = {
                code: "NOT_AUTHENTICATED",
                message: "User not authenticated"
            };
            return next(error);
        }

        if (!allowedRoles.includes(socket.user.role)) {
            const error = new Error("Authorization error");
            error.data = {
                code: "INSUFFICIENT_PERMISSIONS",
                message: "Insufficient permissions"
            };
            return next(error);
        }

        next();
    };
};
