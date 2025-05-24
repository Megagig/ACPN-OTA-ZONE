import { Request, Response, NextFunction } from 'express';
import User, { UserRole, UserStatus } from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import emailService from '../services/email.service';

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
