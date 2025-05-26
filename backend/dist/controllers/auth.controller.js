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
exports.refreshToken = exports.updatePassword = exports.updateDetails = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.logout = exports.login = exports.verifyEmailWithCode = exports.verifyEmail = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = __importStar(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const jwt_1 = require("../utils/jwt");
const email_service_1 = __importDefault(require("../services/email.service"));
const verification_1 = require("../utils/verification");
/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Registration request received:', req.body);
    const { firstName, lastName, email, phone, password, pcnLicense } = req.body;
    // Basic validation for required fields
    if (!firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !pcnLicense) {
        return next(new errorResponse_1.default('Please provide firstName, lastName, email, phone, password, and pcnLicense', 400));
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
    // Create user
    const user = yield user_model_1.default.create({
        firstName,
        lastName,
        email,
        phone,
        password,
        pcnLicense,
        role: user_model_1.UserRole.MEMBER,
        status: user_model_1.UserStatus.PENDING,
    });
    // Generate 6-digit verification code
    const verificationCode = (0, verification_1.generateVerificationCode)();
    user.emailVerificationCode = verificationCode;
    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    // Log for debugging purposes
    console.log('Verification details:', {
        email: user.email,
        code: verificationCode,
        token: verificationToken,
        tokenExpire: user.emailVerificationExpire,
    });
    yield user.save({ validateBeforeSave: false });
    // Create verification URL (used in the email template)
    const verificationUrl = `${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/verify-email/${verificationToken}`;
    try {
        // Send verification email with both link and code
        yield email_service_1.default.sendVerificationEmail(user.email, `${user.firstName} ${user.lastName}`, verificationToken, verificationCode);
        res.status(201).json(Object.assign({ success: true, message: 'User registered. Email verification sent.' }, (process.env.NODE_ENV === 'development' && {
            verificationUrl,
            verificationCode,
        })));
    }
    catch (err) {
        console.error('Email sending error:', err);
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        user.emailVerificationCode = undefined;
        yield user.save({ validateBeforeSave: false });
        return next(new errorResponse_1.default('Email could not be sent', 500));
    }
}));
/**
 * @desc    Verify email with token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Get hashed token
    const emailVerificationToken = crypto_1.default
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = yield user_model_1.default.findOne({
        emailVerificationToken,
        emailVerificationExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(new errorResponse_1.default('Invalid or expired token', 400));
    }
    // Set email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.emailVerificationCode = undefined;
    yield user.save();
    res.status(200).json({
        success: true,
        message: 'Email verified successfully. Please wait for admin approval.',
    });
}));
/**
 * @desc    Verify email with 6-digit code
 * @route   POST /api/auth/verify-email-code
 * @access  Public
 */
exports.verifyEmailWithCode = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, code } = req.body;
    if (!email || !code) {
        return next(new errorResponse_1.default('Please provide email and verification code', 400));
    }
    const user = yield user_model_1.default.findOne({
        email,
        emailVerificationCode: code,
        emailVerificationExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(new errorResponse_1.default('Invalid or expired verification code', 400));
    }
    // Set email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.emailVerificationCode = undefined;
    yield user.save();
    res.status(200).json({
        success: true,
        message: 'Email verified successfully. Please wait for admin approval.',
    });
}));
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // Validate email & password
    if (!email || !password) {
        return next(new errorResponse_1.default('Please provide email and password', 400));
    }
    // Check for user
    const user = yield user_model_1.default.findOne({ email }).select('+password');
    if (!user) {
        return next(new errorResponse_1.default('Invalid credentials', 401));
    }
    // Check if password matches
    const isMatch = yield user.comparePassword(password);
    if (!isMatch) {
        return next(new errorResponse_1.default('Invalid credentials', 401));
    }
    // Check if email is verified
    if (!user.isEmailVerified) {
        return next(new errorResponse_1.default('Please verify your email first', 401));
    }
    // Check if user is approved
    if (!user.isApproved && user.role === user_model_1.UserRole.MEMBER) {
        return next(new errorResponse_1.default('Your account is pending approval by an administrator', 403));
    }
    // Check if user is active
    if (user.status !== user_model_1.UserStatus.ACTIVE) {
        return next(new errorResponse_1.default('Your account is not active. Please contact an administrator.', 403));
    }
    // Update last login date
    user.lastLoginDate = new Date();
    yield user.save({ validateBeforeSave: false });
    // Send response with token
    (0, jwt_1.sendTokenResponse)(user, 200, res);
}));
/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
exports.logout = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // 10 seconds
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        data: {},
    });
}));
/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user,
    });
}));
/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email: req.body.email });
    if (!user) {
        return next(new errorResponse_1.default('No user with that email', 404));
    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    yield user.save({ validateBeforeSave: false });
    try {
        // Send password reset email
        yield email_service_1.default.sendPasswordResetEmail(user.email, `${user.firstName} ${user.lastName}`, resetToken);
        res.status(200).json(Object.assign({ success: true, message: 'Password reset email sent' }, (process.env.NODE_ENV === 'development' && {
            resetToken,
        })));
    }
    catch (err) {
        console.error('Email sending error:', err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        yield user.save({ validateBeforeSave: false });
        return next(new errorResponse_1.default('Email could not be sent', 500));
    }
}));
/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Get hashed token
    const resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = yield user_model_1.default.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(new errorResponse_1.default('Invalid or expired token', 400));
    }
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    yield user.save();
    res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
    });
}));
/**
 * @desc    Update user details
 * @route   PUT /api/auth/update-details
 * @access  Private
 */
exports.updateDetails = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, phone, pcnLicense } = req.body; // Added pcnLicense
    // Basic validation for required fields that can be updated here
    if (!firstName && !lastName && !phone && !pcnLicense) {
        return next(new errorResponse_1.default('No fields to update', 400));
    }
    const fieldsToUpdate = {};
    if (firstName)
        fieldsToUpdate.firstName = firstName;
    if (lastName)
        fieldsToUpdate.lastName = lastName;
    if (phone)
        fieldsToUpdate.phone = phone;
    if (pcnLicense) {
        // If pcnLicense is being updated, check for uniqueness if it's different from the current one
        const currentUser = yield user_model_1.default.findById(req.user.id);
        if (currentUser && currentUser.pcnLicense !== pcnLicense) {
            const existingUserByPcn = (yield user_model_1.default.findOne({
                pcnLicense,
            }));
            if (existingUserByPcn &&
                existingUserByPcn._id.toString() !== req.user.id) {
                return next(new errorResponse_1.default('Another user with this PCN license already exists', 400));
            }
        }
        fieldsToUpdate.pcnLicense = pcnLicense;
    }
    const user = yield user_model_1.default.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: user,
    });
}));
/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.user.id).select('+password');
    if (!user) {
        return next(new errorResponse_1.default('User not found', 404));
    }
    // Check current password
    const isMatch = yield user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
        return next(new errorResponse_1.default('Current password is incorrect', 401));
    }
    user.password = req.body.newPassword;
    yield user.save();
    (0, jwt_1.sendTokenResponse)(user, 200, res);
}));
/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return next(new errorResponse_1.default('Refresh token is required', 400));
    }
    try {
        // Get hashed refresh token
        const hashedRefreshToken = crypto_1.default
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');
        // Find user with this refresh token and check if it's still valid
        const user = yield user_model_1.default.findOne({
            refreshToken: hashedRefreshToken,
            refreshTokenExpire: { $gt: Date.now() },
        });
        if (!user) {
            return next(new errorResponse_1.default('Invalid or expired refresh token', 401));
        }
        // Generate new access token
        const newAccessToken = (0, jwt_1.generateToken)(user);
        res.status(200).json({
            success: true,
            token: newAccessToken,
        });
    }
    catch (err) {
        return next(new errorResponse_1.default('Error refreshing token', 500));
    }
}));
