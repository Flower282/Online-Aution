import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token: 15 minutes
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token: 7 days

/**
 * Generate Access Token (short-lived)
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT access token
 */
export const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Generate Refresh Token (long-lived)
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
}

/**
 * Verify Access Token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {TokenExpiredError} When token is expired
 * @throws {JsonWebTokenError} When token is invalid
 * @throws {NotBeforeError} When token is not yet valid
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        // Re-throw with original error for proper handling
        throw error;
    }
}

/**
 * Verify Refresh Token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {TokenExpiredError} When token is expired
 * @throws {JsonWebTokenError} When token is invalid
 * @throws {NotBeforeError} When token is not yet valid
 */
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        // Re-throw with original error for proper handling
        throw error;
    }
}

/**
 * Verify token without throwing errors
 * Useful for Socket.IO handshake where we need to check validity
 * @param {string} token - JWT access token
 * @returns {Object|null} Decoded token or null if invalid
 */
export const verifyTokenSafe = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}