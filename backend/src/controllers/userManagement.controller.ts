import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../middleware/async.middleware';
import User, { UserRole, UserStatus, IUser } from '../models/user.model';
import Role from '../models/role.model';
import AuditTrail from '../models/auditTrail.model';
import ErrorResponse from '../utils/errorResponse';
import cloudinary from '../config/cloudinary/cloudinary';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { firstName, lastName, phone } = req.body;

    // Find user
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store old values for audit
    const oldUser = user.toObject();

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // Save changes
    await user.save();

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: user._id,
      details: {
        fields: ['firstName', 'lastName', 'phone'],
        oldValues: {
          firstName: oldUser.firstName,
          lastName: oldUser.lastName,
          phone: oldUser.phone,
        },
        newValues: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Upload profile picture
// @route   PUT /api/users/profile/picture
// @access  Private
export const uploadProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    // Find user
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store old picture URL
    const oldPictureUrl = user.profilePicture;

    try {
      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile_pictures',
        public_id: `user_${user._id}`,
        overwrite: true,
      });

      // Update user profile picture
      user.profilePicture = result.secure_url;
      await user.save();

      // Add audit trail
      await AuditTrail.create({
        userId: req.user.id,
        action: 'UPDATE',
        resourceType: 'USER',
        resourceId: user._id,
        details: {
          field: 'profilePicture',
          oldValue: oldPictureUrl,
          newValue: user.profilePicture,
        },
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        data: {
          profilePicture: user.profilePicture,
        },
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image',
      });
    }
  }
);

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, SuperAdmin)
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  // Add pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startIndex = (page - 1) * limit;

  // Add filtering
  const filter: any = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { pcnLicense: searchRegex },
    ];
  }

  // Get users
  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select(
      '-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -refreshToken'
    )
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: users,
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, SuperAdmin)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select(
    '-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -refreshToken'
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (SuperAdmin only)
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a role',
      });
    }

    // Check if role is valid
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Find user
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store old role for audit
    const oldRole = user.role;

    // Update role
    user.role = role as UserRole;
    await user.save();

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'ROLE_ASSIGNMENT',
      resourceType: 'USER',
      resourceId: user._id,
      details: {
        oldRole,
        newRole: user.role,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    });
  }
);

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private (Admin, SuperAdmin)
export const updateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    // Check if status is valid
    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Find user
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if trying to update SuperAdmin (only another SuperAdmin can)
    if (
      user.role === UserRole.SUPERADMIN &&
      req.user.role !== UserRole.SUPERADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update SuperAdmin status',
      });
    }

    // Store old status for audit
    const oldStatus = user.status;

    // Update status
    user.status = status as UserStatus;

    // Also update isApproved based on status
    if (status === UserStatus.ACTIVE) {
      user.isApproved = true;
    } else if (status === UserStatus.REJECTED) {
      user.isApproved = false;
    }

    await user.save();

    // Determine action type for audit trail
    let actionType;
    switch (status) {
      case UserStatus.ACTIVE:
        actionType = 'ACTIVATION';
        break;
      case UserStatus.INACTIVE:
        actionType = 'DEACTIVATION';
        break;
      case UserStatus.SUSPENDED:
        actionType = 'SUSPENSION';
        break;
      case UserStatus.REJECTED:
        actionType = 'REJECTION';
        break;
      default:
        actionType = 'UPDATE';
    }

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: actionType,
      resourceType: 'USER',
      resourceId: user._id,
      details: {
        oldStatus,
        newStatus: user.status,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: 'User status updated successfully',
    });
  }
);

// @desc    Bulk update user status
// @route   PUT /api/users/bulk/status
// @access  Private (Admin, SuperAdmin)
export const bulkUpdateUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userIds, status } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    // Check if status is valid
    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Validate all IDs are valid ObjectIds
    const validIds = userIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more user IDs are invalid',
      });
    }

    // Check for SuperAdmin users in the list (only another SuperAdmin can update)
    if (req.user.role !== UserRole.SUPERADMIN) {
      const superadminCount = await User.countDocuments({
        _id: { $in: validIds },
        role: UserRole.SUPERADMIN,
      });

      if (superadminCount > 0) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update SuperAdmin users',
        });
      }
    }

    // Get users before update for audit
    const usersBeforeUpdate = await User.find({
      _id: { $in: validIds },
    }).select('_id status');

    // Map to easily access by ID
    const userStatusMap = new Map();
    usersBeforeUpdate.forEach((user) => {
      userStatusMap.set(user._id.toString(), user.status);
    });

    // Update users
    const isApproved = status === UserStatus.ACTIVE;

    const result = await User.updateMany(
      { _id: { $in: validIds } },
      {
        $set: {
          status: status,
          isApproved: isApproved,
        },
      }
    );

    // Determine action type for audit trail
    let actionType;
    switch (status) {
      case UserStatus.ACTIVE:
        actionType = 'ACTIVATION';
        break;
      case UserStatus.INACTIVE:
        actionType = 'DEACTIVATION';
        break;
      case UserStatus.SUSPENDED:
        actionType = 'SUSPENSION';
        break;
      case UserStatus.REJECTED:
        actionType = 'REJECTION';
        break;
      default:
        actionType = 'UPDATE';
    }

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'BULK_ACTION',
      resourceType: 'USER',
      details: {
        action: actionType,
        affectedUserIds: validIds,
        newStatus: status,
        modifiedCount: result.modifiedCount,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  }
);

// @desc    Bulk update user role
// @route   PUT /api/users/bulk/role
// @access  Private (SuperAdmin only)
export const bulkUpdateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { userIds, role } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs',
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a role',
      });
    }

    // Check if role is valid
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Validate all IDs are valid ObjectIds
    const validIds = userIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more user IDs are invalid',
      });
    }

    // Get users before update for audit
    const usersBeforeUpdate = await User.find({
      _id: { $in: validIds },
    }).select('_id role');

    // Map to easily access by ID
    const userRoleMap = new Map();
    usersBeforeUpdate.forEach((user) => {
      userRoleMap.set(user._id.toString(), user.role);
    });

    // Update users
    const result = await User.updateMany(
      { _id: { $in: validIds } },
      { $set: { role: role } }
    );

    // Add audit trail
    await AuditTrail.create({
      userId: req.user.id,
      action: 'BULK_ACTION',
      resourceType: 'USER',
      details: {
        action: 'ROLE_ASSIGNMENT',
        affectedUserIds: validIds,
        newRole: role,
        modifiedCount: result.modifiedCount,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  }
);

// @desc    Get user permissions
// @route   GET /api/users/permissions
// @access  Private
export const getUserPermissions = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get the role document
    const role = await Role.findOne({ name: user.role }).populate(
      'permissions'
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        role: role.name,
        permissions: role.permissions,
      },
    });
  }
);

// @desc    Check user permission
// @route   POST /api/users/check-permission
// @access  Private
export const checkUserPermission = asyncHandler(
  async (req: Request, res: Response) => {
    const { resource, action } = req.body;

    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resource and action',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // SuperAdmin has all permissions
    if (user.role === UserRole.SUPERADMIN) {
      return res.status(200).json({
        success: true,
        data: {
          hasPermission: true,
        },
      });
    }

    // Get the role document
    const role = await Role.findOne({ name: user.role }).populate({
      path: 'permissions',
      match: { resource, action },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    const hasPermission = role.permissions.length > 0;

    res.status(200).json({
      success: true,
      data: {
        hasPermission,
      },
    });
  }
);

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  bulkUpdateUserStatus,
  bulkUpdateUserRole,
  getUserPermissions,
  checkUserPermission,
};
