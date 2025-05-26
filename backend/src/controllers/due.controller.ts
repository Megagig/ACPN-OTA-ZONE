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
    due.amountPaid = due.totalAmount; // Mark as fully paid

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
      targetPharmacies = pharmacies.map((p: any) => p._id.toString());
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

// @desc    Bulk assign dues to multiple pharmacies
// @route   POST /api/dues/bulk-assign
// @access  Private/Admin/Treasurer/Financial Secretary
export const bulkAssignDues = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { dueTypeId, amount, dueDate, description, pharmacyIds } = req.body;

    if (
      !dueTypeId ||
      !amount ||
      !dueDate ||
      !pharmacyIds ||
      pharmacyIds.length === 0
    ) {
      throw new ErrorResponse('Please provide all required fields', 400);
    }

    const dues = [];
    const currentYear = new Date().getFullYear();

    for (const pharmacyId of pharmacyIds) {
      const due = await Due.create({
        pharmacyId,
        dueTypeId,
        title: `Bulk Assigned Due - ${currentYear}`,
        description,
        amount,
        dueDate: new Date(dueDate),
        assignmentType: 'bulk',
        assignedBy: req.user._id,
        year: currentYear,
      });
      dues.push(due);
    }

    res.status(201).json({
      success: true,
      count: dues.length,
      data: dues,
    });
  }
);

// @desc    Assign due to specific pharmacy
// @route   POST /api/dues/assign/:pharmacyId
// @access  Private/Admin/Treasurer/Financial Secretary
export const assignDueToPharmacy = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      dueTypeId,
      amount,
      dueDate,
      description,
      title,
      isRecurring,
      recurringFrequency,
    } = req.body;
    const { pharmacyId } = req.params;

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      throw new ErrorResponse('Pharmacy not found', 404);
    }

    const currentYear = new Date().getFullYear();

    // Create the initial due
    const due = await Due.create({
      pharmacyId,
      dueTypeId,
      title: title || `Individual Due - ${currentYear}`,
      description,
      amount,
      dueDate: new Date(dueDate),
      assignmentType: 'individual',
      assignedBy: req.user._id,
      year: currentYear,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
    });

    await due.populate('dueTypeId pharmacyId');

    // If it's recurring, create future instances
    if (isRecurring && recurringFrequency) {
      const futureDues = [];
      const currentDate = new Date(dueDate);

      // Create up to 12 future instances
      for (let i = 1; i <= 12; i++) {
        let nextDueDate = new Date(currentDate);

        switch (recurringFrequency) {
          case 'monthly':
            nextDueDate.setMonth(currentDate.getMonth() + i);
            break;
          case 'quarterly':
            nextDueDate.setMonth(currentDate.getMonth() + i * 3);
            break;
          case 'annually':
            nextDueDate.setFullYear(currentDate.getFullYear() + i);
            break;
        }

        futureDues.push({
          pharmacyId,
          dueTypeId,
          title: `${title || 'Recurring Due'} - ${nextDueDate.getFullYear()}`,
          description,
          amount,
          dueDate: nextDueDate,
          assignmentType: 'individual',
          assignedBy: req.user._id,
          year: nextDueDate.getFullYear(),
          isRecurring: true,
          recurringFrequency,
        });
      }

      if (futureDues.length > 0) {
        await Due.insertMany(futureDues);
      }
    }

    res.status(201).json({
      success: true,
      data: due,
      message: isRecurring
        ? `Due assigned successfully with ${recurringFrequency} recurring schedule`
        : 'Due assigned successfully',
    });
  }
);

// @desc    Add penalty to a due
// @route   POST /api/dues/:id/penalty
// @access  Private/Admin/Treasurer/Financial Secretary
export const addPenaltyToDue = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { amount, reason } = req.body;
    const due = await Due.findById(req.params.id);

    if (!due) {
      throw new ErrorResponse('Due not found', 404);
    }

    due.penalties.push({
      amount,
      reason,
      addedBy: req.user._id,
      addedAt: new Date(),
    });

    await due.save();

    res.status(200).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Get comprehensive dues analytics
// @route   GET /api/dues/analytics/all
// @access  Private/Admin/Treasurer/Financial Secretary
export const getDueAnalytics = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.year as string) || currentYear;

    const analytics = await Due.aggregate([
      { $match: { year } },
      {
        $group: {
          _id: null,
          totalDues: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          outstanding: { $sum: '$balance' },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'overdue'] }, 1, 0] },
          },
        },
      },
    ]);

    const duesByType = await Due.aggregate([
      { $match: { year } },
      {
        $group: {
          _id: '$dueTypeId',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
        },
      },
      {
        $lookup: {
          from: 'duetypes',
          localField: '_id',
          foreignField: '_id',
          as: 'dueType',
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: analytics[0] || {},
        duesByType,
        year,
      },
    });
  }
);

// @desc    Get pharmacy-specific analytics
// @route   GET /api/dues/analytics/pharmacy/:pharmacyId
// @access  Private
export const getPharmacyDueAnalytics = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { pharmacyId } = req.params;
    const currentYear = new Date().getFullYear();

    // Check authorization
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      throw new ErrorResponse('Pharmacy not found', 404);
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      throw new ErrorResponse('Not authorized to view this data', 403);
    }

    const analytics = await Due.aggregate([
      { $match: { pharmacyId: pharmacy._id } },
      {
        $group: {
          _id: null,
          totalDues: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          outstanding: { $sum: '$balance' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: analytics[0] || {},
    });
  }
);

// @desc    Generate clearance certificate
// @route   GET /api/dues/:id/certificate
// @access  Private
export const generateClearanceCertificate = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const due = await Due.findById(req.params.id)
      .populate('pharmacyId')
      .populate('dueTypeId');

    if (!due) {
      throw new ErrorResponse('Due not found', 404);
    }

    if (due.paymentStatus !== PaymentStatus.PAID) {
      throw new ErrorResponse(
        'Due must be fully paid to generate certificate',
        400
      );
    }

    // For now, return certificate data - PDF generation can be added later
    const certificateData = {
      pharmacyName: (due.pharmacyId as any).name,
      dueType: (due.dueTypeId as any).name,
      amount: due.totalAmount,
      paidDate: due.updatedAt,
      validUntil: new Date(new Date().getFullYear(), 11, 31), // Dec 31st of current year
      certificateNumber: `CERT-${due._id}-${Date.now()}`,
    };

    res.status(200).json({
      success: true,
      data: certificateData,
    });
  }
);

// @desc    Mark due as paid manually
// @route   PUT /api/dues/:id/mark-paid
// @access  Private/Admin/Treasurer/Financial Secretary
export const markDueAsPaid = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const due = await Due.findById(req.params.id);

    if (!due) {
      throw new ErrorResponse('Due not found', 404);
    }

    due.amountPaid = due.totalAmount;
    due.paymentStatus = PaymentStatus.PAID;
    await due.save();

    res.status(200).json({
      success: true,
      data: due,
    });
  }
);

// @desc    Get dues by type
// @route   GET /api/dues/type/:typeId
// @access  Private/Admin/Treasurer/Financial Secretary
export const getDuesByType = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { typeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const dues = await Due.find({ dueTypeId: typeId })
      .populate('pharmacyId', 'name registrationNumber')
      .populate('dueTypeId', 'name description')
      .skip(startIndex)
      .limit(limit)
      .sort({ dueDate: -1 });

    const total = await Due.countDocuments({ dueTypeId: typeId });

    res.status(200).json({
      success: true,
      count: dues.length,
      pagination: { page, limit, total },
      data: dues,
    });
  }
);

// @desc    Get overdue dues
// @route   GET /api/dues/overdue
// @access  Private/Admin/Treasurer/Financial Secretary
export const getOverdueDues = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const currentDate = new Date();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const query = {
      dueDate: { $lt: currentDate },
      paymentStatus: { $ne: PaymentStatus.PAID },
    };

    const dues = await Due.find(query)
      .populate('pharmacyId', 'name registrationNumber')
      .populate('dueTypeId', 'name description')
      .skip(startIndex)
      .limit(limit)
      .sort({ dueDate: 1 }); // Oldest first

    const total = await Due.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dues.length,
      pagination: { page, limit, total },
      data: dues,
    });
  }
);

// @desc    Get pharmacy payment history
// @route   GET /api/dues/pharmacy/:pharmacyId/history
// @access  Private
export const getPharmacyPaymentHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { pharmacyId } = req.params;
    const pharmacy = await Pharmacy.findById(pharmacyId);

    if (!pharmacy) {
      throw new ErrorResponse('Pharmacy not found', 404);
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      throw new ErrorResponse('Not authorized to view this data', 403);
    }

    const history = await Due.find({ pharmacyId })
      .populate('dueTypeId', 'name description')
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  }
);
