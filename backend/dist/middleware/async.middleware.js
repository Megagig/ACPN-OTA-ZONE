"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Async handler wrapper to avoid try-catch blocks in route controllers
 * @param fn Function to execute
 * @returns Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.default = asyncHandler;
