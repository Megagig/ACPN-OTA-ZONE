"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.changeUserRole = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = exports.getPendingApprovalUsers = exports.deleteUser = exports.denyUser = exports.approveUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_model_1 = __importStar(require("../models/user.model")); // Corrected User model import and added UserStatus
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const email_service_1 = __importDefault(require("../services/email.service")); // Corrected emailService import
// @desc    Approve a user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
exports.approveUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (yield user_model_1.default.findById(req.params.id)); // Added type assertion
    if (!user) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    // Check if user is already approved
    if (user.isApproved && user.status === user_model_1.UserStatus.ACTIVE) {
        return next(new errorResponse_1.default('User is already approved', 400));
    }
    user.isApproved = true;
    user.status = user_model_1.UserStatus.ACTIVE;
    yield user.save();
    // Optionally, send an email to the user
    try {
        yield email_service_1.default.sendAccountApprovalEmail(user.email, `${user.firstName} ${user.lastName}`);
    }
    catch (error) {
        console.error('Failed to send approval email:', error);
        // Continue even if email fails, just log the error
    }
    res.status(200).json({
        success: true,
        data: user,
        message: 'User approved successfully',
    });
}));
// @desc    Deny a user
// @route   PUT /api/users/:id/deny
// @access  Private/Admin
exports.denyUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (yield user_model_1.default.findById(req.params.id)); // Added type assertion
    if (!user) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    // Check if user is already rejected
    if (user.status === user_model_1.UserStatus.REJECTED) {
        return next(new errorResponse_1.default('User is already rejected', 400));
    }
    user.isApproved = false;
    user.status = user_model_1.UserStatus.REJECTED;
    yield user.save();
    // Optionally, send an email to the user
    // You might want to create a new email template for account rejection
    // For now, we'll just log it
    console.log(`User ${user.email} has been denied.`);
    res.status(200).json({
        success: true,
        data: user,
        message: 'User denied successfully',
    });
}));
// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (yield user_model_1.default.findById(req.params.id)); // Added type assertion
    if (!user) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    yield user.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
        message: 'User deleted successfully',
    });
}));
// @desc    Get pending approval users
// @route   GET /api/users/pending-approvals
// @access  Private/Admin
exports.getPendingApprovalUsers = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const query = {
        status: user_model_1.UserStatus.PENDING,
        isEmailVerified: true, // Only show users who have verified their email
    };
    const users = yield user_model_1.default.find(query)
        .select('-password')
        .skip(startIndex)
        .limit(limit)
        .sort({ createdAt: -1 });
    const total = yield user_model_1.default.countDocuments(query);
    res.status(200).json({
        success: true,
        count: users.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: users,
    });
}));
// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const users = yield user_model_1.default.find()
        .select('-password')
        .skip(startIndex)
        .limit(limit)
        .sort({ createdAt: -1 });
    const total = yield user_model_1.default.countDocuments();
    res.status(200).json({
        success: true,
        count: users.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: users,
    });
}));
// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (yield user_model_1.default.findById(req.params.id)); // Added type assertion
    if (!user) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        data: user,
    });
}));
// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email, phone, password, pcnLicense, role } = req.body;
    // Basic validation for required fields
    if (!firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !pcnLicense ||
        !role) {
        return next(
        // Use next to pass error to error handling middleware
        new errorResponse_1.default('Please provide firstName, lastName, email, phone, password, pcnLicense, and role', 400));
    }
    // Check if user already exists by email
    const existingUserByEmail = yield user_model_1.default.findOne({ email });
    if (existingUserByEmail) {
        return next(new errorResponse_1.default('User with this email already exists', 400));
    }
    // Check if user already exists by PCN license
    const existingUserByPcn = yield user_model_1.default.findOne({ pcnLicense });
    if (existingUserByPcn) {
        return next(new errorResponse_1.default('User with this PCN license already exists', 400));
    }
    // Create a new user
    const user = new user_model_1.default({
        firstName,
        lastName,
        email,
        phone, // Added phone
        password,
        pcnLicense, // Added pcnLicense
        role,
        isApproved: true, // Admins create users as approved by default
        isEmailVerified: true, // Admins create users as email verified by default
        status: user_model_1.UserStatus.ACTIVE, // Admins create users as active by default
    });
    yield user.save();
    res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
    });
}));
// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userFromDb = (yield user_model_1.default.findById(req.params.id));
    if (!userFromDb) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    // Now userFromDb is confirmed to be IUser, so we can safely use its properties
    const user = userFromDb;
    const { firstName, lastName, email, phone, pcnLicense, password, role, isApproved, status, } = req.body;
    // Update user fields
    if (firstName !== undefined)
        user.firstName = firstName;
    if (lastName !== undefined)
        user.lastName = lastName;
    if (phone !== undefined)
        user.phone = phone;
    // Email uniqueness check if email is being changed
    if (email !== undefined && email !== user.email) {
        const existingUserByEmailFromDb = (yield user_model_1.default.findOne({
            email,
        }));
        if (existingUserByEmailFromDb) {
            // existingUserByEmailFromDb is confirmed to be IUser here
            const existingUserByEmail = existingUserByEmailFromDb;
            if (existingUserByEmail._id.toString() !==
                user._id.toString()) {
                return next(new errorResponse_1.default('Email already in use by another user', 400));
            }
        }
        user.email = email;
    }
    // PCN License uniqueness check if pcnLicense is being changed
    if (pcnLicense !== undefined && pcnLicense !== user.pcnLicense) {
        const existingUserByPcnFromDb = (yield user_model_1.default.findOne({
            pcnLicense,
        }));
        if (existingUserByPcnFromDb) {
            // existingUserByPcnFromDb is confirmed to be IUser here
            const existingUserByPcn = existingUserByPcnFromDb;
            if (existingUserByPcn._id.toString() !==
                user._id.toString()) {
                return next(new errorResponse_1.default('PCN License already in use by another user', 400));
            }
        }
        user.pcnLicense = pcnLicense;
    }
    if (password !== undefined) {
        // If password is provided, it will be hashed by the pre-save hook
        user.password = password;
    }
    if (role !== undefined)
        user.role = role;
    if (isApproved !== undefined)
        user.isApproved = isApproved;
    if (status !== undefined)
        user.status = status; // Added status update
    yield user.save();
    res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully',
    });
}));
// @desc    Change user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
exports.changeUserRole = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (yield user_model_1.default.findById(req.params.id)); // Added type assertion
    if (!user) {
        return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
    }
    const { role } = req.body;
    // Update user role
    user.role = role;
    yield user.save();
    res.status(200).json({
        success: true,
        data: user,
        message: 'User role updated successfully',
    });
}));
