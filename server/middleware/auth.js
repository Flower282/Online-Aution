import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import { verifyToken, verifyRefreshToken, generateToken, generateRefreshToken } from "../utils/jwt.js";
import User from "../models/user.js";
dotenv.config();

/**
 * Production-ready authentication middleware with refresh token support
 * Handles token expiration, invalid tokens, and missing tokens with proper error codes
 */
export const secureRoute = async (req, res, next) => {
    const accessToken = req.cookies.auth_token;
    const refreshToken = req.cookies.refresh_token;
    
    // Test environment: Simple JWT verification only (no database, no refresh token)
    if (process.env.NODE_ENV === 'test') {
        if (!accessToken) {
            return res.status(401).json({ 
                code: "TOKEN_MISSING",
                error: "Unauthorized" 
            });
        }
        
        try {
            const JWT_SECRET = process.env.JWT_SECRET;
            const decoded = jwt.verify(accessToken, JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    code: "TOKEN_EXPIRED",
                    error: "Access token expired" 
                });
            }
            return res.status(401).json({ 
                code: "TOKEN_INVALID",
                error: "Invalid token" 
            });
        }
    }
    
    // ==================== PRODUCTION ENVIRONMENT ====================
    
    // Case 1: No access token provided
    if (!accessToken) {
        return res.status(401).json({ 
            code: "TOKEN_MISSING",
            message: "Access token not provided" 
        });
    }

    // Case 2: Verify access token
    try {
        const decoded = verifyToken(accessToken);
        
        // Token is valid, attach user to request
        req.user = decoded;
        return next();
        
    } catch (error) {
        // Handle TokenExpiredError specifically
        if (error.name === 'TokenExpiredError') {
            // Access token expired - try to refresh automatically if refresh token exists
            if (refreshToken) {
                try {
                    // Verify refresh token
                    const refreshDecoded = verifyRefreshToken(refreshToken);
                    
                    // Validate refresh token against database
                    const user = await User.findById(refreshDecoded.id);

                    // Validate user exists, is active, and refresh token matches
                    if (!user) {
                        return res.status(401).json({ 
                            code: "USER_NOT_FOUND",
                            message: "User not found" 
                        });
                    }

                    if (!user.isActive) {
                        return res.status(403).json({ 
                            code: "USER_INACTIVE",
                            message: "Account is inactive" 
                        });
                    }

                    if (user.refreshToken !== refreshToken) {
                        return res.status(401).json({ 
                            code: "REFRESH_TOKEN_INVALID",
                            message: "Refresh token has been revoked" 
                        });
                    }

                    // Generate new tokens (token rotation)
                    const newAccessToken = generateToken(user._id, user.role);
                    const newRefreshToken = generateRefreshToken(user._id);

                    // Update refresh token in database
                    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

                    // Set new tokens as HTTP-only cookies
                    res.cookie("auth_token", newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 15 * 60 * 1000, // 15 minutes
                    });

                    res.cookie("refresh_token", newRefreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    });

                    // Attach user to request and continue
                    req.user = { id: user._id, role: user.role };
                    return next();
                    
                } catch (refreshError) {
                    // Log refresh error only in development
                    if (process.env.NODE_ENV !== 'production') {
                        console.error("Refresh token error:", refreshError.message);
                    }
                    
                    // Refresh token also expired or invalid
                    if (refreshError.name === 'TokenExpiredError') {
                        return res.status(401).json({ 
                            code: "REFRESH_TOKEN_EXPIRED",
                            message: "Refresh token expired. Please login again." 
                        });
                    }
                    
                    return res.status(401).json({ 
                        code: "REFRESH_TOKEN_INVALID",
                        message: "Invalid refresh token" 
                    });
                }
            }
            
            // Access token expired but no refresh token
            return res.status(401).json({ 
                code: "TOKEN_EXPIRED",
                message: "Access token expired. Please login again." 
            });
        }
        
        // Handle other JWT errors (invalid signature, malformed, etc.)
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                code: "TOKEN_INVALID",
                message: "Invalid access token" 
            });
        }
        
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({ 
                code: "TOKEN_NOT_ACTIVE",
                message: "Token not yet active" 
            });
        }
        
        // Log unexpected errors only in development
        if (process.env.NODE_ENV !== 'production') {
            console.error("Unexpected token verification error:", error);
        }
        
        // Generic error response
        return res.status(401).json({ 
            code: "AUTHENTICATION_FAILED",
            message: "Authentication failed" 
        });
    }
}