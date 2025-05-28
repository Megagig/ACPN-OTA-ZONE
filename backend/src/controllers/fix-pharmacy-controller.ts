// Fix for 500 error in getMyPharmacy endpoint

import { Request, Response, NextFunction } from 'express';
import Pharmacy from '../models/pharmacy.model';
import User from '../models/user.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

/**
 * Enhanced version of getMyPharmacy with better error handling
 * Replace the original function in pharmacy.controller.ts with this one
 */
export const getMyPharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user exists in the request
      if (!req.user || !req.user._id) {
        console.error('User not found in request or missing _id');
        return next(new ErrorResponse('User not authenticated properly', 401));
      }

      // Log the user ID we're searching for
      console.log(`Looking for pharmacy with userId: ${req.user._id}`);

      // Validate that the user ID is valid
      const userExists = await User.findById(req.user._id);
      if (!userExists) {
        console.error(`User with ID ${req.user._id} not found in database`);
        return next(new ErrorResponse('User not found in database', 404));
      }

      // Find the pharmacy with proper error handling
      try {
        const pharmacy = await Pharmacy.findOne({
          userId: req.user._id,
        }).populate('userId', 'firstName lastName email phone');

        if (!pharmacy) {
          console.log(`No pharmacy found for user ${req.user._id}`);
          return next(
            new ErrorResponse('Pharmacy not found for the current user', 404)
          );
        }

        // Successfully found the pharmacy
        console.log(`Successfully found pharmacy for user ${req.user._id}`);
        res.status(200).json({
          success: true,
          data: pharmacy,
        });
      } catch (dbError) {
        console.error(`Database error when finding pharmacy: ${dbError}`);
        return next(new ErrorResponse('Error querying pharmacy database', 500));
      }
    } catch (error) {
      console.error('Unexpected error in getMyPharmacy:', error);
      return next(new ErrorResponse('Server error getting pharmacy data', 500));
    }
  }
);
