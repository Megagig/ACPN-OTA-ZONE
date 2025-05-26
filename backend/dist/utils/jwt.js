"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.sendTokenResponse = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate JWT access token for authenticated users
 * @param user The user object
 * @returns JWT token
 */
const generateToken = (user) => {
    const payload = { id: user._id, role: user.role };
    const secret = process.env.JWT_SECRET || 'fallbacksecret';
    // Create a properly typed options object
    const options = {};
    // Access tokens have shorter lifespan
    const defaultExpire = '1h';
    options.expiresIn = process.env.JWT_EXPIRE
        ? process.env.JWT_EXPIRE
        : defaultExpire;
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
/**
 * Send token response with cookie
 * @param user User object
 * @param statusCode HTTP status code
 * @param res Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
    // Create access token
    const token = (0, exports.generateToken)(user);
    // Generate refresh token
    const refreshToken = user.generateRefreshToken();
    // Save the user with the refresh token
    user.save({ validateBeforeSave: false });
    const cookieOptions = {
        expires: new Date(Date.now() +
            parseInt(process.env.JWT_COOKIE_EXPIRE || '1') *
                24 *
                60 *
                60 *
                1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };
    res
        .status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
        success: true,
        token,
        refreshToken,
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            isEmailVerified: user.isEmailVerified,
            isApproved: user.isApproved,
            status: user.status,
        },
    });
};
exports.sendTokenResponse = sendTokenResponse;
/**
 * Verify JWT token
 * @param token The JWT token to verify
 * @returns Decoded token data or null if invalid
 */
const verifyToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'fallbacksecret';
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (err) {
        return null;
    }
};
exports.verifyToken = verifyToken;
