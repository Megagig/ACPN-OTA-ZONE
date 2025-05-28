import { Request, Response, NextFunction } from 'express';
import Due, { PaymentStatus } from '../models/due.model';
import Pharmacy from '../models/pharmacy.model';
import Payment from '../models/payment.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import path from 'path';
import { getNextCertificateNumber } from '../utils/counter';

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

    // Check if populate query param is present
    const populateFields = req.query.populate
      ? String(req.query.populate).split(',')
      : [];

    // Build the base query
    let dueQuery = Due.find(query).populate({
      path: 'pharmacyId',
      select: 'name registrationNumber location',
      populate: {
        path: 'userId',
        select: 'firstName lastName email phone',
      },
    });

    // Add dueTypeId population if requested
    if (populateFields.includes('dueTypeId') || req.query.populate === 'true') {
      dueQuery = dueQuery.populate('dueTypeId');
    }

    // Apply pagination and sorting
    const dues = await dueQuery
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

    // Check if populate query param is present
    const populateFields = req.query.populate
      ? String(req.query.populate).split(',')
      : [];

    // Build query
    let query = Due.find({ pharmacyId: req.params.pharmacyId });

    // Apply population if requested
    if (populateFields.includes('dueTypeId') || req.query.populate === 'true') {
      query = query.populate('dueTypeId');
    }

    // Sort by year in descending order
    query = query.sort({ year: -1 });

    const dues = await query;

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
    const due = await Due.findById(req.params.id)
      .populate({
        path: 'pharmacyId',
        select: 'name registrationNumber userId',
      })
      .populate('dueTypeId');

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
    const dueYear = new Date(dueDate).getFullYear();
    const failedAssignments = [];

    for (const pharmacyId of pharmacyIds) {
      try {
        // Check if pharmacy exists
        const pharmacy = await Pharmacy.findById(pharmacyId);
        if (!pharmacy) {
          failedAssignments.push({
            pharmacyId,
            error: 'Pharmacy not found',
          });
          continue;
        }

        try {
          // Check if a due already exists
          const existingDue = await Due.findOne({
            pharmacyId,
            dueTypeId,
            year: dueYear,
          });

          // FIX FOR E11000 DUPLICATE KEY ERROR:
          // Like in the assignDueToPharmacy method, we're using findOneAndUpdate with upsert
          // to avoid race conditions that could lead to duplicate key errors when multiple
          // dues are being assigned at the same time. This is particularly important in
          // bulk operations where concurrent requests are more likely.
          //
          // The atomic operation ensures we either update an existing due or create a new one
          // without the possibility of trying to create duplicates.
          const updateData = {
            title: `Bulk Assigned Due - ${dueYear}`,
            description: description || '',
            amount: amount,
            dueDate: new Date(dueDate),
            assignmentType: 'bulk',
            assignedBy: req.user._id,
            year: dueYear,
          };

          const due = await Due.findOneAndUpdate(
            {
              pharmacyId,
              dueTypeId,
              year: dueYear,
            },
            updateData,
            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            }
          );

          // If we're updating an existing due, add a note to the response
          if (existingDue) {
            // Use type-safe approach with interface extension
            const dueObject = due.toObject();
            // Use type assertion to add the custom property
            (dueObject as any).updated = true;
            dues.push(dueObject);
          } else {
            dues.push(due);
          }
        } catch (error: any) {
          // Track pharmacies that failed to be assigned due to database errors
          if (error.code === 11000) {
            failedAssignments.push({
              pharmacyId,
              error: `A due with the same due type already exists for this pharmacy for ${dueYear}`,
            });
            continue;
          }

          failedAssignments.push({
            pharmacyId,
            error: error.message || 'Failed to assign due',
          });
        }
      } catch (error: any) {
        // Track pharmacies that failed to be assigned
        failedAssignments.push({
          pharmacyId,
          error: error.message || 'Failed to assign due',
        });
      }
    }

    res.status(201).json({
      success: true,
      count: dues.length,
      data: dues,
      failedAssignments:
        failedAssignments.length > 0 ? failedAssignments : undefined,
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
    const dueYear = new Date(dueDate).getFullYear();

    // FIX FOR E11000 DUPLICATE KEY ERROR:
    // Previously, this function was using a pattern of checking if a due exists first,
    // and then either creating or updating it. This approach is prone to race conditions
    // that can lead to duplicate key errors (E11000) in high concurrency situations.
    //
    // The fix uses findOneAndUpdate with upsert:true which is an atomic operation that either:
    // 1. Updates an existing record if one is found matching the query criteria, or
    // 2. Creates a new record if no matching record exists
    //
    // This is a safer approach as it eliminates the race condition window between
    // checking for existence and creating a new record.
    // Check if a due already exists
    const existingDue = await Due.findOne({
      pharmacyId,
      dueTypeId,
      year: dueYear,
    });

    let due;

    try {
      const updateData = {
        title: title || `Individual Due - ${dueYear}`,
        description: description || '',
        amount: amount,
        dueDate: new Date(dueDate),
        assignmentType: 'individual',
        assignedBy: req.user._id,
        year: dueYear,
        isRecurring: isRecurring || false,
        recurringFrequency: recurringFrequency || null,
      };

      // If a due exists, just update it without throwing an error
      due = await Due.findOneAndUpdate(
        {
          pharmacyId,
          dueTypeId,
          year: dueYear,
        },
        updateData,
        {
          new: true, // Return the updated document
          upsert: true, // Create if it doesn't exist
          runValidators: true, // Run validators for update
          setDefaultsOnInsert: true, // Apply defaults on insert
        }
      );
    } catch (error: any) {
      // Only throw an error if it's not a duplicate key error
      if (error.code !== 11000) {
        throw error;
      }
      // For duplicate key errors, we'll just use the existing due
      console.log('Duplicate key error handled - due already exists');
    }

    // Populate references
    const populatedDue = await Due.findOne({
      pharmacyId,
      dueTypeId,
      year: dueYear,
    }).populate('dueTypeId pharmacyId');

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
          default:
            continue; // Skip if invalid frequency
        }

        // Use the same upsert pattern for recurring dues to prevent duplicates
        try {
          const recurringDue = await Due.findOneAndUpdate(
            {
              pharmacyId,
              dueTypeId,
              year: nextDueDate.getFullYear(),
            },
            {
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
            },
            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            }
          );
        } catch (error: any) {
          // Log but don't throw error for duplicate recurring dues
          if (error.code === 11000) {
            console.log(
              `Recurring due for year ${nextDueDate.getFullYear()} already exists - skipping.`
            );
          } else {
            console.error(
              `Error creating recurring due for year ${nextDueDate.getFullYear()}:`,
              error
            );
          }
          // Continue with other recurring dues even if one fails
        }
      }
    }

    res.status(201).json({
      success: true,
      data: populatedDue,
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
    // Add debugging logs
    console.log(`Certificate requested for due ID: ${req.params.id}`);

    const due = await Due.findById(req.params.id)
      .populate('pharmacyId')
      .populate('dueTypeId');

    if (!due) {
      console.log(`Due not found with ID: ${req.params.id}`);
      throw new ErrorResponse('Due not found', 404);
    }

    console.log(
      `Due payment status: ${due.paymentStatus}, Required status: ${PaymentStatus.PAID}`
    );

    if (due.paymentStatus !== PaymentStatus.PAID) {
      console.log(
        `Certificate generation denied - due not fully paid. Current status: ${due.paymentStatus}`
      );
      throw new ErrorResponse(
        'Due must be fully paid to generate certificate',
        400
      );
    }

    // Generate a 4-digit incremental certificate number
    const certificateNumber = await getNextCertificateNumber();

    // For now, return certificate data - PDF generation can be added later
    const certificateData = {
      pharmacyName: (due.pharmacyId as any).name,
      dueType: (due.dueTypeId as any).name,
      amount: due.totalAmount,
      paidDate: due.updatedAt,
      validUntil: new Date(new Date().getFullYear(), 11, 31), // Dec 31st of current year
      certificateNumber,
    };

    console.log(
      `Certificate successfully generated for due ID: ${req.params.id}`
    );

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

    // First, get all payments for this pharmacy from Payment model
    const payments = await Payment.find({ pharmacyId })
      .populate('dueId')
      .sort({ createdAt: -1 });

    // Also get all dues to include those without payments
    const dues = await Due.find({ pharmacyId })
      .populate('dueTypeId', 'name description defaultAmount isRecurring')
      .sort({ dueDate: -1 });

    // Combine both for complete history
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
      // Include dues separately so frontend can show both
      dues: dues,
    });
  }
);

// @desc    Generate a PDF clearance certificate
// @route   POST /api/dues/generate-certificate-pdf
// @access  Private
export const generatePDFCertificate = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const certificateData = req.body;

    if (!certificateData || !certificateData.pharmacyName) {
      throw new ErrorResponse('Certificate data is required', 400);
    }

    try {
      // Import the PDF generation libraries only when needed
      const PDFDocument = require('pdfkit');
      const fs = require('fs');

      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'portrait', // Changed to portrait for a more formal certificate
        info: {
          Title: 'ACPN Ota Zone Clearance Certificate',
          Author: 'ACPN Ota Zone',
          Subject: 'Clearance Certificate',
          Keywords: 'clearance, certificate, pharmacy, ACPN',
          CreationDate: new Date(),
        },
      });

      // Add decorative border to the page
      doc
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3)
        .stroke('#006400'); // Dark green border

      // Add inner border
      doc
        .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(1)
        .dash(5, { space: 5 })
        .stroke('#006400'); // Dashed inner border

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ACPN_Certificate_${certificateData.certificateNumber}.pdf"`
      );

      // Pipe the PDF directly to the response
      doc.pipe(res);

      // Add content to the PDF
      const logoPath = path.resolve(__dirname, '../assets/acpn-logo.png'); // Absolute path to the logo file
      try {
        if (fs.existsSync(logoPath)) {
          // Add the logo with better sizing and positioning
          doc.image(logoPath, 50, 45, { width: 100, align: 'center' });
          console.log('Logo successfully added from:', logoPath);
        } else {
          console.warn('Logo file not found:', logoPath);
          // Add a placeholder for the logo with ACPN text
          doc
            .circle(100, 80, 40)
            .lineWidth(2)
            .stroke('#006400')
            .fillOpacity(0.1)
            .fill('#006400')
            .fillOpacity(1)
            .fontSize(16)
            .fill('#006400')
            .text('ACPN', 75, 70, { align: 'center' })
            .fontSize(12)
            .text('OTA ZONE', 75, 90, { align: 'center' });
        }
      } catch (err) {
        console.error('Error adding logo to PDF:', err);
        // Continue without the logo but add a text placeholder
        doc
          .circle(100, 80, 40)
          .lineWidth(2)
          .stroke('#006400')
          .fillOpacity(0.1)
          .fill('#006400')
          .fillOpacity(1)
          .fontSize(16)
          .fill('#006400')
          .text('ACPN', 75, 70, { align: 'center' })
          .fontSize(12)
          .text('OTA ZONE', 75, 90, { align: 'center' });
      }

      // Title with decorative elements
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#006400')
        .text('CLEARANCE CERTIFICATE', { align: 'center' })
        .moveDown(0.2);

      // Decorative line
      doc
        .moveTo(doc.page.width / 2 - 100, doc.y)
        .lineTo(doc.page.width / 2 + 100, doc.y)
        .lineWidth(3)
        .stroke('#006400')
        .moveDown(0.5);

      // Organization name with professional styling
      doc
        .fillColor('#000000')
        .fontSize(16)
        .text('Pharmaceutical Society of Nigeria', { align: 'center' })
        .fontSize(18)
        .fillColor('#006400')
        .text('ACPN Ota Zone', { align: 'center' })
        .moveDown(1);

      // Certificate content - make it stand out more
      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor('#333333')
        .text('This is to certify that:', { align: 'center' })
        .moveDown(0.5);

      // Pharmacy name - make it bold and prominent
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#000000')
        .text(certificateData.pharmacyName, { align: 'center' })
        .moveDown(0.2);

      // Decorative underline for pharmacy name
      doc
        .moveTo(doc.page.width / 2 - 100, doc.y)
        .lineTo(doc.page.width / 2 + 100, doc.y)
        .lineWidth(1)
        .stroke('#006400')
        .moveDown(0.8);

      // Certificate details
      doc
        .font('Helvetica')
        .fontSize(12)
        .text('This is to certify that the above-named pharmacy', {
          align: 'center',
        })
        .moveDown(0.2)
        .font('Helvetica-Bold')
        .text(
          `has fulfilled all financial obligations to the Association of Community Pharmacists of Nigeria, Ota Zone,`,
          { align: 'center' }
        )
        .moveDown(0.2)
        .font('Helvetica')
        .text(
          `pertaining to the ${certificateData.dueType} for ${new Date(certificateData.paidDate).getFullYear()}.`,
          { align: 'center' }
        )
        .moveDown(1);

      // Certificate details
      doc.fontSize(11);

      // Two columns
      const leftColumn = 150;
      const rightColumn = 450;

      doc.text('Certificate Number:', leftColumn, 300);
      doc
        .font('Helvetica-Bold')
        .text(certificateData.certificateNumber, rightColumn, 300);

      doc.font('Helvetica').text('Due Type:', leftColumn, 325);
      doc
        .font('Helvetica-Bold')
        .text(certificateData.dueType, rightColumn, 325);

      doc.font('Helvetica').text('Amount Paid:', leftColumn, 350);
      doc.font('Helvetica-Bold').text(
        `₦ ${certificateData.amount.toLocaleString('en-NG', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        rightColumn,
        350
      );

      doc.font('Helvetica').text('Payment Date:', leftColumn, 375);
      doc.font('Helvetica-Bold').text(
        new Date(certificateData.paidDate).toLocaleDateString('en-NG', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        rightColumn,
        375
      );

      doc.font('Helvetica').text('Valid Until:', leftColumn, 400);
      doc.font('Helvetica-Bold').text(
        new Date(certificateData.validUntil).toLocaleDateString('en-NG', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        rightColumn,
        400
      );

      // Signature placeholders
      const signatureY = 500;

      // Chairman signature
      doc
        .font('Helvetica')
        .fontSize(11)
        .moveTo(120, signatureY)
        .lineTo(220, signatureY)
        .lineWidth(1)
        .stroke()
        .text('Chairman', 150, signatureY + 15)
        .font('Helvetica-Oblique')
        .fontSize(8)
        .text('ACPN Ota Zone', 150, signatureY + 30);

      // Secretary signature
      doc
        .font('Helvetica')
        .fontSize(11)
        .moveTo(400, signatureY)
        .lineTo(500, signatureY)
        .lineWidth(1)
        .stroke()
        .text('Secretary', 430, signatureY + 15)
        .font('Helvetica-Oblique')
        .fontSize(8)
        .text('ACPN Ota Zone', 430, signatureY + 30);

      // Stamp placeholder - make it more prominent
      doc
        .circle(300, signatureY, 40)
        .dash(3, { space: 2 })
        .lineWidth(1.5)
        .stroke('#006400');

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#006400')
        .text('OFFICIAL STAMP', 270, signatureY - 5, { align: 'center' });

      // Footer
      const footerY = 580;

      // Add decorative line above footer
      doc
        .moveTo(100, footerY - 20)
        .lineTo(doc.page.width - 100, footerY - 20)
        .lineWidth(0.5)
        .stroke('#006400');

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#333333')
        .text(
          'This certificate is issued in accordance with the regulations of the',
          50,
          footerY,
          { align: 'center' }
        )
        .text(
          'Association of Community Pharmacists of Nigeria (ACPN) Ota Zone.',
          50,
          footerY + 12,
          { align: 'center' }
        )
        .font('Helvetica-Bold')
        .text(
          `Issue Date: ${new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          50,
          footerY + 30,
          { align: 'center' }
        )
        .font('Helvetica-Oblique')
        .text(
          'Verify this certificate by contacting the ACPN Ota Zone Secretariat',
          50,
          footerY + 45,
          { align: 'center' }
        );

      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Error generating PDF certificate:', error);
      throw new ErrorResponse('Failed to generate certificate PDF', 500);
    }
  }
);
