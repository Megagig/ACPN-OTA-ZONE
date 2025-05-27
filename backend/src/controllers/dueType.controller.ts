import { Request, Response, NextFunction } from 'express';
import DueType from '../models/dueType.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all due types
// @route   GET /api/due-types
// @access  Private/Admin/Financial Secretary/Treasurer
export const getDueTypes = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { isActive } = req.query;

    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const dueTypes = await DueType.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: dueTypes.length,
      data: dueTypes,
    });
  }
);

// @desc    Get single due type
// @route   GET /api/due-types/:id
// @access  Private/Admin/Financial Secretary/Treasurer
export const getDueType = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dueType = await DueType.findById(req.params.id).populate(
      'createdBy',
      'firstName lastName email'
    );

    if (!dueType) {
      return next(
        new ErrorResponse(`Due type not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: dueType,
    });
  }
);

// @desc    Create new due type
// @route   POST /api/due-types
// @access  Private/Admin/Financial Secretary/Treasurer
export const createDueType = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    req.body.createdBy = req.user._id;

    // Ensure defaultAmount is a number
    if (req.body.defaultAmount) {
      req.body.defaultAmount = Number(req.body.defaultAmount);
    }

    const dueType = await DueType.create(req.body);

    res.status(201).json({
      success: true,
      data: dueType,
    });
  }
);

// @desc    Update due type
// @route   PUT /api/due-types/:id
// @access  Private/Admin/Financial Secretary/Treasurer
export const updateDueType = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let dueType = await DueType.findById(req.params.id);

    if (!dueType) {
      return next(
        new ErrorResponse(`Due type not found with id of ${req.params.id}`, 404)
      );
    }

    // Ensure defaultAmount is a number
    if (req.body.defaultAmount) {
      req.body.defaultAmount = Number(req.body.defaultAmount);
    }

    dueType = await DueType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: dueType,
    });
  }
);

// @desc    Delete due type (soft delete by setting isActive to false)
// @route   DELETE /api/due-types/:id
// @access  Private/Admin/Superadmin
export const deleteDueType = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dueType = await DueType.findById(req.params.id);

    if (!dueType) {
      return next(
        new ErrorResponse(`Due type not found with id of ${req.params.id}`, 404)
      );
    }

    // Soft delete by setting isActive to false
    await DueType.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);
