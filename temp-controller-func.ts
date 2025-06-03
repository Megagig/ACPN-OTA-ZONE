import { Request, Response } from 'express';
import asyncHandler from './backend/src/middleware/async.middleware';
import ErrorResponse from './backend/src/utils/errorResponse';

// Import the penalty calculation function
import { calculateMeetingPenalties } from './updated-penalty-calculation';

// @desc    Calculate meeting penalties for a year
// @route   POST /api/events/calculate-penalties/:year
// @access  Private (Admin only)
export const calculatePenalties = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const year = parseInt(req.params.year);

    if (!year || isNaN(year)) {
      throw new ErrorResponse('Invalid year provided', 400);
    }

    await calculateMeetingPenalties(year);

    res.status(200).json({
      success: true,
      message: `Penalties for ${year} have been calculated successfully.`,
    });
  }
);
