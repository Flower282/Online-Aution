import { connectDB } from "../connection.js"
import User from "../models/user.js"
import Login from "../models/Login.js"
import bcrypt from "bcrypt";
import dotenv from "dotenv"
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { getClientIp, getLocationFromIp } from "../utils/geoDetails.js";
dotenv.config();


export const handleUserLogin = async (req, res) => {
    // Ensure req.body exists (for cases where Content-Type is wrong)
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "All Fields are required" });
    }
    
    const { email, password } = req.body;
    
    // Type validation - reject non-strings (NoSQL injection prevention)
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "All Fields are required" });
    }
    
    // Trim and validate - reject empty or whitespace-only
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
        return res.status(400).json({ error: "All Fields are required" });
    }
    
    try {
        await connectDB();
        const user = await User.findOne({ email: trimmedEmail });
        //  Checking user exists
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin." });
        }

        // Password Validate
        const psswordValidate = await bcrypt.compare(trimmedPassword, user.password);
        if (!psswordValidate) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        // generating jwt tokens
        const accessToken = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token to database
        await User.findByIdAndUpdate(user._id, { refreshToken });

        // Set HTTP-only cookies
        res.cookie("auth_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        // Getting user gro location
        const ip = getClientIp(req);
        const userAgent = req.headers["user-agent"];
        const location = await getLocationFromIp(ip);

        // Update user's last login and location
        await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
            location: location,
            ipAddress: ip,
            userAgent: userAgent
        });

        // Saving login details
        const login = new Login({
            userId: user._id,
            ipAddress: ip,
            userAgent,
            location,
            loginAt: new Date(),
        })
        await login.save();

        return res.status(200).json({ message: "Login Successful" });

    } catch (error) {
        return res.status(500).json({ error: "Server error from handle login" });
    }
}

export const handleUserSignup = async (req, res) => {
    // Ensure req.body exists (for cases where Content-Type is wrong)
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    const { name, email, password } = req.body;

    // Basic presence check
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Only validate strings (for whitespace), non-strings will be handled by MongoDB
    const trimmedName = typeof name === 'string' ? name.trim() : name;
    const trimmedEmail = typeof email === 'string' ? email.trim() : email;
    const trimmedPassword = typeof password === 'string' ? password.trim() : password;
    
    // Check if strings are empty after trimming
    if ((typeof name === 'string' && !trimmedName) || 
        (typeof email === 'string' && !trimmedEmail) || 
        (typeof password === 'string' && !trimmedPassword)) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    try {
        await connectDB();
        const existingUser = await User.findOne({ email: trimmedEmail });

        // Checking existing of user
        if (existingUser)
            return res.status(400).json({ error: "User already exists" });

        // Getting geo details
        const ip = getClientIp(req);
        const userAgent = req.headers["user-agent"];
        const location = await getLocationFromIp(ip);

        // Hashing user password
        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

        // Saving user to database
        const newUser = new User({
            name: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
            avatar: "https://avatar.iran.liara.run/public/7",
            ipAddress: ip,
            userAgent,
            location,
            signupAt: new Date(),
            lastLogin: new Date(),
        });
        await newUser.save();

        const login = new Login({
            userId: newUser._id,
            ipAddress: ip,
            userAgent,
            location,
            loginAt: new Date(),
        })
        await login.save();

        // Generating jwt tokens
        const accessToken = generateToken(newUser._id, newUser.role);
        const refreshToken = generateRefreshToken(newUser._id);

        // Save refresh token to database
        await User.findByIdAndUpdate(newUser._id, { refreshToken });

        // Set HTTP-only cookies
        res.cookie("auth_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
}

export const handleUserLogout = async (req, res) => {
    try {
        // Clear refresh token from database if user is authenticated
        if (req.user && req.user.id) {
            await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
        }

        // Clear both cookies
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        res.clearCookie("refresh_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Logout failed" });
    }
}

/**
 * Refresh Token Handler with Token Rotation
 * 
 * Security Features:
 * - Token rotation: Issues new refresh token on each refresh
 * - Prevents refresh token reuse
 * - Validates token against database
 * - Checks user active status
 * 
 * @route POST /auth/refresh-token
 * @access Public (requires valid refresh token)
 */
export const handleRefreshToken = async (req, res) => {
    try {
        // Accept refresh token from HTTP-only cookie (preferred) or body (fallback)
        // Cookie is preferred for security (XSS protection)
        const refreshToken = req.cookies.refresh_token || req.body.refreshToken;

        // Case 1: No refresh token provided
        if (!refreshToken) {
            return res.status(401).json({ 
                code: "REFRESH_TOKEN_MISSING",
                message: "Refresh token not provided" 
            });
        }

        // Case 2: Verify refresh token signature and expiration
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            // Handle specific JWT errors
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    code: "REFRESH_TOKEN_EXPIRED",
                    message: "Refresh token expired. Please login again." 
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    code: "REFRESH_TOKEN_INVALID",
                    message: "Invalid refresh token" 
                });
            }
            
            // Generic error
            return res.status(401).json({ 
                code: "REFRESH_TOKEN_ERROR",
                message: "Failed to verify refresh token" 
            });
        }

        // Case 3: Check if refresh token exists in database and matches
        await connectDB();
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ 
                code: "USER_NOT_FOUND",
                message: "User not found" 
            });
        }

        // Case 4: Validate refresh token matches database (prevents token reuse)
        if (user.refreshToken !== refreshToken) {
            // This could indicate:
            // - Token has been rotated (old token being reused)
            // - Token has been revoked
            // - Possible security breach
            
            // Optional: Revoke all tokens for this user
            await User.findByIdAndUpdate(user._id, { refreshToken: null });
            
            return res.status(401).json({ 
                code: "REFRESH_TOKEN_REUSED",
                message: "Refresh token has been revoked or already used" 
            });
        }

        // Case 5: Check if user account is active
        if (!user.isActive) {
            return res.status(403).json({ 
                code: "USER_INACTIVE",
                message: "Account is inactive. Please contact support." 
            });
        }

        // ==================== TOKEN ROTATION ====================
        // Generate new access token AND new refresh token
        const newAccessToken = generateToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        // Update refresh token in database (invalidates old refresh token)
        await User.findByIdAndUpdate(user._id, { 
            refreshToken: newRefreshToken,
            lastTokenRefresh: new Date() // Optional: track refresh activity
        });

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

        // Return success response with user info
        return res.status(200).json({
            code: "TOKEN_REFRESHED",
            message: "Tokens refreshed successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // Log error only in development
        if (process.env.NODE_ENV !== 'production') {
            console.error("Refresh token error:", error);
        }
        
        return res.status(500).json({ 
            code: "SERVER_ERROR",
            message: "Failed to refresh token" 
        });
    }
}

/**
 * Get Current Access Token
 * Helper endpoint for client to retrieve access token for Socket.IO
 * 
 * @route GET /auth/token
 * @access Private (requires valid access token cookie)
 */
export const handleGetToken = async (req, res) => {
    try {
        const accessToken = req.cookies.auth_token;

        if (!accessToken) {
            return res.status(401).json({ 
                code: "TOKEN_MISSING",
                message: "Access token not found" 
            });
        }

        // Return token for Socket.IO connection
        return res.status(200).json({
            token: accessToken
        });
    } catch (error) {
        return res.status(500).json({ 
            code: "SERVER_ERROR",
            message: "Failed to retrieve token" 
        });
    }
}