"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const notFound = (req, res, next) => {
    next(new errorResponse_1.default(`Not Found - ${req.originalUrl}`, 404));
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    // Log the request method and path for debugging
    console.error('Error occurred for request:', req.method, req.originalUrl);
    // Log the error stack for debugging
    if (err && err.stack) {
        console.error('Error stack:', err.stack);
    }
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
    // Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    }
    // Mongoose duplicate key
    if (err.code && err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};
exports.errorHandler = errorHandler;
