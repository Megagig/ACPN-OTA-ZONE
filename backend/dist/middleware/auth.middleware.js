"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jwt_1 = require("../utils/jwt");
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const user_model_1 = __importDefault(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("./async.middleware"));
/**
 * Middleware to protect routes - verify the user is logged in
 */
exports.protect = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    // Check for token in Authorization header or cookies
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        // Extract token from Bearer header
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.token) {
        // Get token from cookie
        token = req.cookies.token;
    }
    // Check if token exists
    if (!token) {
        return next(new errorResponse_1.default('Not authorized to access this route', 401));
    }
    try {
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            return next(new errorResponse_1.default('Token is invalid or expired', 401));
        }
        // Find user by id
        const user = yield user_model_1.default.findById(decoded.id);
        if (!user) {
            return next(new errorResponse_1.default('User not found', 404));
        }
        // Check if user is active
        if (user.status !== 'active') {
            return next(new errorResponse_1.default('Your account is not active. Please contact an administrator.', 403));
        }
        // Add user to request object
        req.user = user;
        next();
    }
    catch (err) {
        return next(new errorResponse_1.default('Not authorized to access this route', 401));
    }
}));
/**
 * Grant access to specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorResponse_1.default('User not found in request', 500));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorResponse_1.default(`Role '${req.user.role}' is not authorized to access this route`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
