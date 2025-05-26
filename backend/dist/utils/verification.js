"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidVerificationCode = exports.generateVerificationCode = void 0;
/**
 * Generate a random 6-digit verification code
 * @returns string - 6-digit code
 */
const generateVerificationCode = () => {
    // Generate a random number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateVerificationCode = generateVerificationCode;
/**
 * Check if a verification code is valid
 * @param code The code to validate
 * @returns boolean
 */
const isValidVerificationCode = (code) => {
    // Check if code is exactly 6 digits
    return /^\d{6}$/.test(code);
};
exports.isValidVerificationCode = isValidVerificationCode;
