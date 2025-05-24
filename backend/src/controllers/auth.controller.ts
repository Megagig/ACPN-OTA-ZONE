import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User, { UserRole, UserStatus } from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import { sendTokenResponse, generateToken } from '../utils/jwt';
import emailService from '../services/email.service';
import { generateVerificationCode } from '../utils/verification';

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, phone, password, pcnLicense } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(
        new ErrorResponse('User with this email already exists', 400)
      );
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      pcnLicense,
      role: UserRole.MEMBER,
      status: UserStatus.PENDING,
    });

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    user.emailVerificationCode = verificationCode;

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL (used in the email template)
    const verificationUrl = `${process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`}/verify-email/${verificationToken}`;

    try {
      // Send verification email with both link and code
      await emailService.sendVerificationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        verificationToken,
        verificationCode
      );

      res.status(201).json({
        success: true,
        message: 'User registered. Email verification sent.',
        // For development, return the verification details
        ...(process.env.NODE_ENV === 'development' && {
          verificationUrl,
          verificationCode,
        }),
      });
    } catch (err) {
      console.error('Email sending error:', err);

      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      user.emailVerificationCode = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  }
);

/**
 * @desc    Verify email with token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Set email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.emailVerificationCode = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Please wait for admin approval.',
    });
  }
);

/**
 * @desc    Verify email with 6-digit code
 * @route   POST /api/auth/verify-email-code
 * @access  Public
 */
export const verifyEmailWithCode = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return next(
        new ErrorResponse('Please provide email and verification code', 400)
      );
    }

    const user = await User.findOne({
      email,
      emailVerificationCode: code,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorResponse('Invalid or expired verification code', 400)
      );
    }

    // Set email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.emailVerificationCode = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Please wait for admin approval.',
    });
  }
);

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return next(new ErrorResponse('Please verify your email first', 401));
    }

    // Check if user is approved
    if (!user.isApproved && user.role === UserRole.MEMBER) {
      return next(
        new ErrorResponse(
          'Your account is pending approval by an administrator',
          403
        )
      );
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      return next(
        new ErrorResponse(
          'Your account is not active. Please contact an administrator.',
          403
        )
      );
    }

    // Update last login date
    user.lastLoginDate = new Date();
    await user.save({ validateBeforeSave: false });

    // Send response with token
    sendTokenResponse(user, 200, res);
  }
);

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse('No user with that email', 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send password reset email
      await emailService.sendPasswordResetEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        resetToken
      );

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
        // For development, return the reset token
        ...(process.env.NODE_ENV === 'development' && {
          resetToken,
        }),
      });
    } catch (err) {
      console.error('Email sending error:', err);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  }
);

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        'Password reset successful. You can now login with your new password.',
    });
  }
);

/**
 * @desc    Update user details
 * @route   PUT /api/auth/update-details
 * @access  Private
 */
export const updateDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
export const updatePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);

    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  }
);

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ErrorResponse('Refresh token is required', 400));
    }

    try {
      // Get hashed refresh token
      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Find user with this refresh token and check if it's still valid
      const user = await User.findOne({
        refreshToken: hashedRefreshToken,
        refreshTokenExpire: { $gt: Date.now() },
      });

      if (!user) {
        return next(new ErrorResponse('Invalid or expired refresh token', 401));
      }

      // Generate new access token
      const newAccessToken = generateToken(user);

      res.status(200).json({
        success: true,
        token: newAccessToken,
      });
    } catch (err) {
      return next(new ErrorResponse('Error refreshing token', 500));
    }
  }
);
