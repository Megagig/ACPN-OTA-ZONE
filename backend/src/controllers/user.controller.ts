import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import User, { IUser, UserStatus, UserRole } from '../models/user.model'; // Corrected User model import and added UserStatus
import ErrorResponse from '../utils/errorResponse';
import emailService from '../services/email.service'; // Corrected emailService import

// @desc    Approve a user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
export const approveUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (await User.findById(req.params.id)) as IUser | null; // Added type assertion

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is already approved
    if (user.isApproved && user.status === UserStatus.ACTIVE) {
      return next(new ErrorResponse('User is already approved', 400));
    }

    user.isApproved = true;
    user.status = UserStatus.ACTIVE;
    await user.save();

    // Optionally, send an email to the user
    try {
      await emailService.sendAccountApprovalEmail(
        user.email,
        `${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error('Failed to send approval email:', error);
      // Continue even if email fails, just log the error
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User approved successfully',
    });
  }
);

// @desc    Deny a user
// @route   PUT /api/users/:id/deny
// @access  Private/Admin
export const denyUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (await User.findById(req.params.id)) as IUser | null; // Added type assertion

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is already rejected
    if (user.status === UserStatus.REJECTED) {
      return next(new ErrorResponse('User is already rejected', 400));
    }

    user.isApproved = false;
    user.status = UserStatus.REJECTED;
    await user.save();

    // Optionally, send an email to the user
    // You might want to create a new email template for account rejection
    // For now, we'll just log it
    console.log(`User ${user.email} has been denied.`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User denied successfully',
    });
  }
);

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (await User.findById(req.params.id)) as IUser | null; // Added type assertion

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully',
    });
  }
);

// @desc    Get pending approval users
// @route   GET /api/users/pending-approvals
// @access  Private/Admin
export const getPendingApprovalUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const query = {
      status: UserStatus.PENDING,
      isEmailVerified: true, // Only show users who have verified their email
    };

    const users = await User.find(query)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

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
  }
);

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

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
  }
);

// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (await User.findById(req.params.id)) as IUser | null; // Added type assertion

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { firstName, lastName, email, phone, password, pcnLicense, role } =
      req.body;

    // Basic validation for required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password ||
      !pcnLicense ||
      !role
    ) {
      return next(
        // Use next to pass error to error handling middleware
        new ErrorResponse(
          'Please provide firstName, lastName, email, phone, password, pcnLicense, and role',
          400
        )
      );
    }

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return next(
        new ErrorResponse('User with this email already exists', 400)
      );
    }

    // Check if user already exists by PCN license
    const existingUserByPcn = await User.findOne({ pcnLicense });
    if (existingUserByPcn) {
      return next(
        new ErrorResponse('User with this PCN license already exists', 400)
      );
    }

    // Create a new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone, // Added phone
      password,
      pcnLicense, // Added pcnLicense
      role,
      isApproved: true, // Admins create users as approved by default
      isEmailVerified: true, // Admins create users as email verified by default
      status: UserStatus.ACTIVE, // Admins create users as active by default
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  }
);

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userFromDb = (await User.findById(req.params.id)) as IUser | null;

    if (!userFromDb) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }
    // Now userFromDb is confirmed to be IUser, so we can safely use its properties
    const user: IUser = userFromDb;

    const {
      firstName,
      lastName,
      email,
      phone,
      pcnLicense,
      password,
      role,
      isApproved,
      status,
    } = req.body;

    // Update user fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    // Email uniqueness check if email is being changed
    if (email !== undefined && email !== user.email) {
      const existingUserByEmailFromDb = (await User.findOne({
        email,
      })) as IUser | null;
      if (existingUserByEmailFromDb) {
        // existingUserByEmailFromDb is confirmed to be IUser here
        const existingUserByEmail: IUser = existingUserByEmailFromDb;
        if (
          (existingUserByEmail._id as any).toString() !==
          (user._id as any).toString()
        ) {
          return next(
            new ErrorResponse('Email already in use by another user', 400)
          );
        }
      }
      user.email = email;
    }

    // PCN License uniqueness check if pcnLicense is being changed
    if (pcnLicense !== undefined && pcnLicense !== user.pcnLicense) {
      const existingUserByPcnFromDb = (await User.findOne({
        pcnLicense,
      })) as IUser | null;
      if (existingUserByPcnFromDb) {
        // existingUserByPcnFromDb is confirmed to be IUser here
        const existingUserByPcn: IUser = existingUserByPcnFromDb;
        if (
          (existingUserByPcn._id as any).toString() !==
          (user._id as any).toString()
        ) {
          return next(
            new ErrorResponse('PCN License already in use by another user', 400)
          );
        }
      }
      user.pcnLicense = pcnLicense;
    }

    if (password !== undefined) {
      // If password is provided, it will be hashed by the pre-save hook
      user.password = password;
    }
    if (role !== undefined) user.role = role;
    if (isApproved !== undefined) user.isApproved = isApproved;
    if (status !== undefined) user.status = status; // Added status update

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  }
);

// @desc    Change user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
export const changeUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (await User.findById(req.params.id)) as IUser | null; // Added type assertion

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    const { role } = req.body;

    // Update user role
    user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    });
  }
);
