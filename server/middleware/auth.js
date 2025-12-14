import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import { verifyToken, verifyRefreshToken, generateToken } from "../utils/jwt.js";
import User from "../models/user.js";
import { connectDB } from "../connection.js";
dotenv.config();

// Simple authentication for test environment
// Full refresh token logic for production
export const secureRoute = async (req, res, next) => {
    const token = req.cookies.auth_token;
    
    // Test environment: Simple JWT verification only (no database, no refresh token)
    if (process.env.NODE_ENV === 'test') {
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        try {
            const JWT_SECRET = process.env.JWT_SECRET;
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        return;
    }
    
    // Production environment: Full refresh token support
    const accessToken = token;
    const refreshToken = req.cookies.refresh_token;

    // No access token
    if (!accessToken) {
        // Try to refresh if refresh token exists
        if (refreshToken) {
            try {
                const decoded = verifyRefreshToken(refreshToken);
                await connectDB();
                const user = await User.findById(decoded.id);

                if (user && user.refreshToken === refreshToken && user.isActive) {
                    // Generate new access token
                    const newAccessToken = generateToken(user._id, user.role);

                    // Set new access token cookie
                    res.cookie("auth_token", newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 15 * 60 * 1000, // 15 minutes
                    });

                    req.user = { id: user._id, role: user.role };
                    return next();
                }
            } catch (error) {
                console.error("Refresh token error in middleware:", error);
            }
        }

        return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify access token
    try {
        const decoded = verifyToken(accessToken);
        req.user = decoded;
        next();
    } catch (error) {
        // Access token expired, try refresh token
        if (error.name === 'TokenExpiredError' && refreshToken) {
            try {
                const decoded = verifyRefreshToken(refreshToken);
                await connectDB();
                const user = await User.findById(decoded.id);

                if (user && user.refreshToken === refreshToken && user.isActive) {
                    // Generate new access token
                    const newAccessToken = generateToken(user._id, user.role);

                    // Set new access token cookie
                    res.cookie("auth_token", newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 15 * 60 * 1000, // 15 minutes
                    });

                    req.user = { id: user._id, role: user.role };
                    return next();
                }
            } catch (refreshError) {
                console.error("Refresh token error:", refreshError);
                return res.status(401).json({ error: "Invalid or expired token" });
            }
        }

        console.error("Token verification error:", error);
        
        // Return 401 for any JWT errors
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}