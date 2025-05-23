import { Request, Response, NextFunction } from 'express';
import Due, { PaymentStatus } from '../models/due.model';
import Pharmacy from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all dues
// @route   GET /api/dues
// @access  Private/Admin
export const getAllDues = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by payment status if provided
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    // Filter by year if provided
    if (req.query.year) {
      query.year = parseInt(req.query.year as string);
    }

    const dues = await Due.find(query)
      .populate({
        path: 'pharmacyId',
        select: 'name registrationNumber location',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone',
        },
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ dueDate: -1 });

    // Get total count
    const total = await Due.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dues.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: dues,
    });
  }
);

// @desc    Get dues for a pharmacy
// @route   GET /api/pharmacies/:pharmacyId/dues
// @access  Private
export const getPharmacyDues = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);

    if (!pharmacy) {
      return next(
        new ErrorResponse(
          `Pharmacy not found with id of ${req.params.pharmacyId}`,
          404
        )
      );
    }

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access these dues`,
          403
        )
      );
    }

    const dues = await Due.find({ pharmacyId: req.params.pharmacyId }).sort({
      year: -1,
    });

    res.status(200).json({
      success: true,
      count: dues.length,
      data: dues,
    });
  }
);

// @desc    Get a single due
// @route   GET /api/dues/:id
// @access  Private
export const getDue = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const due = await Due.findById(req.params.id).populate({
      path: 'pharmacyId',
      select: 'name registrationNumber userId',
    });

    if (!due) {
      return next(
        new ErrorResponse(`Due not found with id of ${req.params.id}`, 404)
      );
    }

    const pharmacy = due.pharmacyId as unknown as { userId: any };

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access this due`,
          403
        )
      );
    }

    res.status(200).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Create a due
// @route   POST /api/pharmacies/:pharmacyId/dues
// @access  Private/Admin/Treasurer
export const createDue = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.body.pharmacyId = req.params.pharmacyId;

    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);

    if (!pharmacy) {
      return next(
        new ErrorResponse(
          `Pharmacy not found with id of ${req.params.pharmacyId}`,
          404
        )
      );
    }

    // Only admin and treasurer can create dues
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to create dues`,
          403
        )
      );
    }

    // Check if a due already exists for this pharmacy and year
    const existingDue = await Due.findOne({
      pharmacyId: req.params.pharmacyId,
      year: req.body.year,
    });

    if (existingDue) {
      return next(
        new ErrorResponse(`Due already exists for this pharmacy and year`, 400)
      );
    }

    const due = await Due.create(req.body);

    res.status(201).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Update a due
// @route   PUT /api/dues/:id
// @access  Private/Admin/Treasurer
export const updateDue = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let due = await Due.findById(req.params.id);

    if (!due) {
      return next(
        new ErrorResponse(`Due not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin and treasurer can update dues
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update dues`,
          403
        )
      );
    }

    due = await Due.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Delete a due
// @route   DELETE /api/dues/:id
// @access  Private/Admin/Treasurer
export const deleteDue = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const due = await Due.findById(req.params.id);

    if (!due) {
      return next(
        new ErrorResponse(`Due not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin and treasurer can delete dues
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete dues`,
          403
        )
      );
    }

    await due.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Mark a due as paid
// @route   PUT /api/dues/:id/pay
// @access  Private/Admin/Treasurer
export const payDue = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const due = await Due.findById(req.params.id);

    if (!due) {
      return next(
        new ErrorResponse(`Due not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin, treasurer, or pharmacy owner can mark dues as paid
    const pharmacy = await Pharmacy.findById(due.pharmacyId);
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      pharmacy?.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to pay this due`,
          403
        )
      );
    }

    due.paymentStatus = PaymentStatus.PAID;
    due.paymentDate = new Date();
    due.paymentReference = req.body.paymentReference || `Manual-${Date.now()}`;

    await due.save();

    res.status(200).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Get dues statistics
// @route   GET /api/dues/stats
// @access  Private/Admin/Treasurer
export const getDuesStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const currentYear = new Date().getFullYear();

    // Get total dues for current year
    const totalDuesThisYear = await Due.aggregate([
      {
        $match: { year: currentYear },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0],
            },
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get dues by month for current year
    const duesByMonth = await Due.aggregate([
      {
        $match: {
          year: currentYear,
          paymentDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        thisYear: totalDuesThisYear[0] || {
          total: 0,
          count: 0,
          paid: 0,
          paidCount: 0,
          compliance: 0,
        },
        byMonth: duesByMonth,
        compliance: totalDuesThisYear[0]
          ? (totalDuesThisYear[0].paidCount / totalDuesThisYear[0].count) * 100
          : 0,
      },
    });
  }
);
