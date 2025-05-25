import { Request, Response, NextFunction } from 'express';
import User, { UserRole, UserStatus, IUser } from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import emailService from '../services/email.service';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by role if provided
    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.params.id).select('-password');

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

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      pcnLicense,
      role,
      isApproved,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return next(
        new ErrorResponse('User with that email already exists', 400)
      );
    }

    // Create user with status directly active if created by admin
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      pcnLicense,
      role: role || UserRole.MEMBER,
      isEmailVerified: true, // Admin-created users don't need email verification
      isApproved: isApproved !== undefined ? isApproved : true,
      status: UserStatus.ACTIVE,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Don't allow password updates through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Approve user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
export const approveUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    // Only update if the user isn't already approved
    if (!user.isApproved) {
      user.isApproved = true;
      user.status = UserStatus.ACTIVE;
      await user.save();

      // Send approval notification email
      try {
        await emailService.sendAccountApprovalEmail(
          user.email,
          `${user.firstName} ${user.lastName}`
        );
      } catch (error) {
        console.error('Failed to send approval email:', error);
        // Continue even if email fails, just log the error
      }
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User approved successfully',
    });
  }
);

// @desc    Change user role
// @route   PUT /api/users/:id/role
// @access  Private/SuperAdmin
export const changeUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      return next(new ErrorResponse('Please provide a valid role', 400));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    user.role = role as UserRole;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);
