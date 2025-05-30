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
    let error = Object.assign({}, err);
    error.message = err.message;
    // Log error details for debugging
    console.error('Error encountered:');
    console.error(`Request URL: ${req.originalUrl}`);
    console.error(`Method: ${req.method}`);
    console.error(`Error name: ${err.name}`);
    console.error(`Error message: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    if (err.response) {
        console.error(`Response data: ${JSON.stringify(err.response.data)}`);
    }
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new errorResponse_1.default(message, 404);
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new errorResponse_1.default(message, 400);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new errorResponse_1.default(message.join(', '), 400, Object.values(err.errors));
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new errorResponse_1.default('Invalid token', 401);
    }
    if (err.name === 'TokenExpiredError') {
        error = new errorResponse_1.default('Token expired', 401);
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        errors: error.errors || [],
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;
