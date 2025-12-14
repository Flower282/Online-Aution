import { connectDB } from "../connection.js"
import User from "../models/user.js"
import Login from "../models/Login.js"
import bcrypt from "bcrypt";
import dotenv from "dotenv"
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { getClientIp, getLocationFromIp } from "../utils/geoDetails.js";
dotenv.config();


export const handleUserLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "All Fields are required" });
    try {
        await connectDB();
        const user = await User.findOne({ email });
        //  Checking user exists
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ admin." });
        }

        // Password Validate
        const psswordValidate = await bcrypt.compare(password, user.password);
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
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Server error from handle login" });
    }
}

export const handleUserSignup = async (req, res) => {
    await connectDB();
    const { name, email, password } = req.body;

    // Checking input fields
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        await connectDB();
        const existingUser = await User.findOne({ email });

        // Checking existing of user
        if (existingUser)
            return res.status(400).json({ error: "User already exists" });

        // Getting geo details
        const ip = getClientIp(req);
        const userAgent = req.headers["user-agent"];
        const location = await getLocationFromIp(ip);

        // Hashing user password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Saving user to database
        const newUser = new User({
            name,
            email,
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
        console.log(err);
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

export const handleRefreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token not found" });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Check if refresh token exists in database
        await connectDB();
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ error: "Account is inactive" });
        }

        // Generate new access token
        const newAccessToken = generateToken(user._id, user.role);

        // Set new access token cookie
        res.cookie("auth_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(403).json({ error: "Invalid or expired refresh token" });
    }
}