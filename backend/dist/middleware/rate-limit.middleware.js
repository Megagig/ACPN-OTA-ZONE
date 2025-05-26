"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerificationLimiter = exports.passwordResetLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiter for authentication routes
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests, please try again after 15 minutes',
    },
});
/**
 * Rate limiter for password reset requests
 */
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after an hour',
    },
});
/**
 * Rate limiter for email verification
 */
exports.emailVerificationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 verification attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many verification attempts, please try again after an hour',
    },
});
