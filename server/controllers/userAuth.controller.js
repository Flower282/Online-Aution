import { connectDB } from "../connection.js"
import User from "../models/user.js"
import Login from "../models/Login.js"
import bcrypt from "bcrypt";
import dotenv from "dotenv"
import { generateToken } from "../utils/jwt.js";
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

        // generating jwt token
        const token = generateToken(user._id, user.role);

        // Set HTTP-only cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
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

        // Generating jwt token
        const token = generateToken(newUser._id, newUser.role);

        // Set HTTP-only cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
}

export const handleUserLogout = async (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    return res.status(200).json({ message: "Logged out successfully" });
}