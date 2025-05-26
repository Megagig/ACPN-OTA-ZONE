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

// @desc    Assign dues to pharmacies (bulk or individual)
// @route   POST /api/dues/assign
// @access  Private/Admin/Financial Secretary/Treasurer
export const assignDues = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      dueTypeId,
      title,
      description,
      amount,
      dueDate,
      assignmentType,
      pharmacyIds, // For individual assignment
      isRecurring,
      nextDueDate,
    } = req.body;

    // Validate required fields
    if (!dueTypeId || !title || !amount || !dueDate || !assignmentType) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    const year = new Date(dueDate).getFullYear();
    const assignedBy = req.user._id;
    const assignedAt = new Date();

    let targetPharmacies: string[] = [];

    if (assignmentType === 'bulk') {
      // Get all active pharmacies
      const pharmacies = await Pharmacy.find({
        registrationStatus: 'active',
      }).select('_id');
      targetPharmacies = pharmacies.map((p) => p._id.toString());
    } else if (assignmentType === 'individual') {
      if (
        !pharmacyIds ||
        !Array.isArray(pharmacyIds) ||
        pharmacyIds.length === 0
      ) {
        return next(
          new ErrorResponse(
            'Pharmacy IDs are required for individual assignment',
            400
          )
        );
      }
      targetPharmacies = pharmacyIds;
    } else {
      return next(new ErrorResponse('Invalid assignment type', 400));
    }

    const createdDues = [];
    const errors = [];

    // Create dues for each pharmacy
    for (const pharmacyId of targetPharmacies) {
      try {
        // Check if due already exists for this pharmacy, due type, and year
        const existingDue = await Due.findOne({
          pharmacyId,
          dueTypeId,
          year,
        });

        if (existingDue) {
          errors.push({
            pharmacyId,
            error: `Due already exists for this pharmacy and due type in ${year}`,
          });
          continue;
        }

        const dueData = {
          pharmacyId,
          dueTypeId,
          title,
          description,
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          assignmentType,
          assignedBy,
          assignedAt,
          year,
          isRecurring: isRecurring || false,
          nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined,
        };

        const due = await Due.create(dueData);
        createdDues.push(due);
      } catch (error) {
        console.error(`Error creating due for pharmacy ${pharmacyId}:`, error);
        errors.push({
          pharmacyId,
          error: 'Failed to create due',
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        created: createdDues.length,
        errors: errors.length,
        dues: createdDues,
        errorDetails: errors,
      },
    });
  }
);

// @desc    Add penalty to a due
// @route   POST /api/dues/:id/penalty
// @access  Private/Admin/Financial Secretary/Treasurer
export const addPenalty = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return next(
        new ErrorResponse('Penalty amount and reason are required', 400)
      );
    }

    const due = await Due.findById(req.params.id);

    if (!due) {
      return next(
        new ErrorResponse(`Due not found with id of ${req.params.id}`, 404)
      );
    }

    // Add penalty
    due.penalties.push({
      amount: parseFloat(amount),
      reason,
      addedBy: req.user._id,
      addedAt: new Date(),
    });

    await due.save(); // Pre-save middleware will recalculate totals

    const populatedDue = await Due.findById(due._id)
      .populate('pharmacyId', 'name registrationNumber')
      .populate('dueTypeId', 'name')
      .populate('penalties.addedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: populatedDue,
    });
  }
);

// @desc    Remove penalty from a due
// @route   DELETE /api/dues/:id/penalty/:penaltyId
// @access  Private/Admin/Superadmin
export const removePenalty = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id, penaltyId } = req.params;

    const due = await Due.findById(id);

    if (!due) {
      return next(new ErrorResponse(`Due not found with id of ${id}`, 404));
    }

    // Find and remove penalty
    const penaltyIndex = due.penalties.findIndex(
      (p) => p._id?.toString() === penaltyId
    );

    if (penaltyIndex === -1) {
      return next(
        new ErrorResponse(`Penalty not found with id of ${penaltyId}`, 404)
      );
    }

    due.penalties.splice(penaltyIndex, 1);
    await due.save(); // Pre-save middleware will recalculate totals

    res.status(200).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Get dues analytics for admin dashboard
// @route   GET /api/dues/analytics
// @access  Private/Admin/Financial Secretary/Treasurer
export const getDuesAnalytics = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { year, startDate, endDate } = req.query;
    const currentYear = year
      ? parseInt(year as string)
      : new Date().getFullYear();

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.dueDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else {
      dateFilter.year = currentYear;
    }

    // Overview statistics
    const [
      totalDues,
      paidDues,
      partiallyPaidDues,
      overdueDues,
      totalAmount,
      totalPaid,
      totalPenalties,
    ] = await Promise.all([
      Due.countDocuments(dateFilter),
      Due.countDocuments({ ...dateFilter, paymentStatus: 'paid' }),
      Due.countDocuments({ ...dateFilter, paymentStatus: 'partially_paid' }),
      Due.countDocuments({ ...dateFilter, paymentStatus: 'overdue' }),
      Due.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Due.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      Due.aggregate([
        { $match: dateFilter },
        { $unwind: { path: '$penalties', preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, total: { $sum: '$penalties.amount' } } },
      ]),
    ]);

    // Due type breakdown
    const dueTypeBreakdown = await Due.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'duetypes',
          localField: 'dueTypeId',
          foreignField: '_id',
          as: 'dueType',
        },
      },
      { $unwind: '$dueType' },
      {
        $group: {
          _id: '$dueType.name',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
          outstanding: { $sum: '$balance' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Monthly trends (for current year)
    const monthlyTrends = await Due.aggregate([
      { $match: { year: currentYear } },
      {
        $group: {
          _id: { $month: '$dueDate' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top defaulting pharmacies
    const topDefaulters = await Due.aggregate([
      {
        $match: {
          ...dateFilter,
          paymentStatus: { $in: ['pending', 'overdue', 'partially_paid'] },
        },
      },
      {
        $group: {
          _id: '$pharmacyId',
          totalOutstanding: { $sum: '$balance' },
          duesCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'pharmacies',
          localField: '_id',
          foreignField: '_id',
          as: 'pharmacy',
        },
      },
      { $unwind: '$pharmacy' },
      {
        $project: {
          pharmacyName: '$pharmacy.name',
          registrationNumber: '$pharmacy.registrationNumber',
          totalOutstanding: 1,
          duesCount: 1,
        },
      },
      { $sort: { totalOutstanding: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDues,
          paidDues,
          partiallyPaidDues,
          overdueDues,
          pendingDues: totalDues - paidDues - partiallyPaidDues - overdueDues,
          totalAmount: totalAmount[0]?.total || 0,
          totalPaid: totalPaid[0]?.total || 0,
          totalOutstanding:
            (totalAmount[0]?.total || 0) - (totalPaid[0]?.total || 0),
          totalPenalties: totalPenalties[0]?.total || 0,
          collectionRate: totalAmount[0]?.total
            ? ((totalPaid[0]?.total || 0) / totalAmount[0].total) * 100
            : 0,
        },
        dueTypeBreakdown,
        monthlyTrends,
        topDefaulters,
      },
    });
  }
);

// @desc    Get pharmacy-specific dues analytics
// @route   GET /api/pharmacies/:pharmacyId/dues/analytics
// @access  Private/Pharmacy Owner/Admin
export const getPharmacyDuesAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { pharmacyId } = req.params;
    const { year } = req.query;
    const currentYear = year
      ? parseInt(year as string)
      : new Date().getFullYear();

    // Check authorization
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${pharmacyId}`, 404)
      );
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      req.user.role !== 'financial_secretary' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view analytics for this pharmacy`,
          403
        )
      );
    }

    // Get dues summary
    const duesSummary = await Due.aggregate([
      { $match: { pharmacyId: pharmacy._id, year: currentYear } },
      {
        $group: {
          _id: null,
          totalDues: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balance' },
          totalPenalties: {
            $sum: {
              $reduce: {
                input: '$penalties',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.amount'] },
              },
            },
          },
          paidDues: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
          },
          overdueDues: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, 1, 0] },
          },
        },
      },
    ]);

    // Get dues by type
    const duesByType = await Due.aggregate([
      { $match: { pharmacyId: pharmacy._id, year: currentYear } },
      {
        $lookup: {
          from: 'duetypes',
          localField: 'dueTypeId',
          foreignField: '_id',
          as: 'dueType',
        },
      },
      { $unwind: '$dueType' },
      {
        $group: {
          _id: '$dueType.name',
          amount: { $sum: '$totalAmount' },
          paid: { $sum: '$amountPaid' },
          outstanding: { $sum: '$balance' },
          status: { $first: '$paymentStatus' },
        },
      },
    ]);

    // Payment history
    const paymentHistory = await Due.aggregate([
      { $match: { pharmacyId: pharmacy._id } },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'dueId',
          as: 'payments',
        },
      },
      { $unwind: { path: '$payments', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'payments.approvalStatus': 'approved',
        },
      },
      {
        $group: {
          _id: { $year: '$payments.approvedAt' },
          totalPaid: { $sum: '$payments.amount' },
          paymentsCount: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: duesSummary[0] || {
          totalDues: 0,
          totalAmount: 0,
          amountPaid: 0,
          totalOutstanding: 0,
          totalPenalties: 0,
          paidDues: 0,
          overdueDues: 0,
        },
        duesByType,
        paymentHistory,
        complianceRate: duesSummary[0]
          ? (duesSummary[0].paidDues / duesSummary[0].totalDues) * 100
          : 0,
      },
    });
  }
);
