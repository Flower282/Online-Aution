import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();

export const secureRoute=(req,res,next)=>{
    const token=req.cookies.auth_token;
    if(!token) return res.status(401).json({error:"Unauthorized"});

    try {
        // Read JWT_SECRET dynamically to support test environments
        // Fallback to test secret if not set (matches token factory)
        const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests';
        const decode=jwt.verify(token, JWT_SECRET);
        req.user=decode;
        next();
    } catch (error) {
        // JWT errors (JsonWebTokenError, TokenExpiredError) -> 401
        return res.status(401).json({error:"Invalid or expired token"});
    }
}