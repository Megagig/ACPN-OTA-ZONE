import { Request, Response, NextFunction } from 'express';
import Payment, { PaymentApprovalStatus } from '../models/payment.model';
import Due, { PaymentStatus } from '../models/due.model';
import Pharmacy from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

// @desc    Submit payment for a due
// @route   POST /api/payments/submit
// @access  Private
export const submitPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { dueId, pharmacyId, amount, paymentMethod, paymentReference } =
      req.body;

    if (!dueId || !pharmacyId || !amount) {
      return next(
        new ErrorResponse('Missing required fields for payment submission', 400)
      );
    }

    // Check if pharmacy exists and user owns it
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${pharmacyId}`, 404)
      );
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to submit payment for this pharmacy`,
          403
        )
      );
    }

    // Check if due exists
    const due = await Due.findById(dueId);
    if (!due) {
      return next(new ErrorResponse(`Due not found with id of ${dueId}`, 404));
    }

    // Check if due belongs to the pharmacy
    if (due.pharmacyId.toString() !== pharmacyId) {
      return next(
        new ErrorResponse('Due does not belong to this pharmacy', 400)
      );
    }

    // Validate payment amount
    const parsedAmount = parseFloat(amount as string);
    if (parsedAmount <= 0) {
      return next(
        new ErrorResponse('Payment amount must be greater than 0', 400)
      );
    }

    if (parsedAmount > due.balance) {
      return next(
        new ErrorResponse(
          `Payment amount (${parsedAmount}) exceeds outstanding balance (${due.balance})`,
          400
        )
      );
    }

    // Handle receipt upload with multer (req.file instead of req.files)
    if (!req.file) {
      return next(new ErrorResponse('Receipt upload is required', 400));
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(
        new ErrorResponse(
          'Please upload a valid receipt file (JPEG, JPG, PNG, or PDF)',
          400
        )
      );
    }

    try {
      console.log('Processing payment submission:', {
        dueId,
        pharmacyId,
        amount,
        paymentMethod,
      });
      console.log('File information:', req.file);

      // For multer uploads, use req.file.path
      let receiptUrl, receiptPublicId;

      try {
        if (!req.file) {
          console.error('Missing file in request');
          return next(
            new ErrorResponse('Receipt file is missing or invalid', 400)
          );
        }

        console.log('Complete file object:', JSON.stringify(req.file, null, 2));

        // Make sure we have a valid path - Multer may use different properties
        const filePath =
          req.file.path ||
          (req.file as any).destination + '/' + (req.file as any).filename;

        // Upload to Cloudinary if available
        if (typeof uploadToCloudinary === 'function') {
          console.log('Uploading to Cloudinary:', filePath);
          const result = await uploadToCloudinary(filePath, 'payment-receipts');
          receiptUrl = result.secure_url;
          receiptPublicId = result.public_id;
          console.log('Cloudinary upload successful:', {
            receiptUrl,
            receiptPublicId,
          });
        } else {
          // Fallback if Cloudinary is not available
          // Use static route path for receipts
          receiptUrl = `/static/receipts/${req.file.filename}`;
          receiptPublicId = req.file.filename;
          console.log('Using local file path:', receiptUrl);
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        // Fallback to local path
        if (req.file && req.file.filename) {
          receiptUrl = `/static/receipts/${req.file.filename}`;
          receiptPublicId = req.file.filename;
          console.log('Fallback to local path after error:', receiptUrl);
        } else {
          return next(
            new ErrorResponse('Failed to process receipt upload', 500)
          );
        }
      }

      // Create payment record
      console.log('Creating payment record with:', {
        dueId,
        pharmacyId,
        amount: parseFloat(amount as string),
        receiptUrl,
        userId: req.user._id,
      });

      const payment = await Payment.create({
        dueId,
        pharmacyId,
        amount: parseFloat(amount as string),
        paymentMethod,
        paymentReference,
        receiptUrl,
        receiptPublicId,
        submittedBy: req.user._id,
        approvalStatus: PaymentApprovalStatus.PENDING,
        paymentDate: new Date(),
      });

      console.log('Payment created successfully:', payment._id);

      const populatedPayment = await Payment.findById(payment._id)
        .populate('dueId', 'title amount totalAmount')
        .populate('pharmacyId', 'name registrationNumber')
        .populate('submittedBy', 'firstName lastName email');

      res.status(201).json({
        success: true,
        data: populatedPayment,
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      // Provide more detailed error information
      const errorMessage =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : 'Unknown error processing payment';

      console.error(errorMessage);

      return next(
        new ErrorResponse(
          `Error processing payment submission: ${errorMessage}`,
          500
        )
      );
    }
  }
);

// @desc    Get payments for a due
// @route   GET /api/pharmacies/:pharmacyId/dues/:dueId/payments
// @access  Private/Pharmacy Owner/Admin
export const getDuePayments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { pharmacyId, dueId } = req.params;

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
          `User ${req.user._id} is not authorized to view payments for this pharmacy`,
          403
        )
      );
    }

    const payments = await Payment.find({ dueId, pharmacyId })
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  }
);

// @desc    Get all payments with filters for admin
// @route   GET /api/payments/admin/all
// @access  Private/Admin/Financial Secretary/Treasurer
export const getAllPayments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const status = req.query.status as string;

    let filter: any = {};
    if (status && status !== 'all') {
      filter.approvalStatus = status;
    }

    const payments = await Payment.find(filter)
      .populate({
        path: 'dueId',
        select: 'title amount totalAmount dueDate',
        populate: {
          path: 'dueTypeId',
          select: 'name',
        },
      })
      .populate('pharmacyId', 'name registrationNumber')
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// @desc    Get all pending payments for admin review
// @route   GET /api/payments/pending
// @access  Private/Admin/Financial Secretary/Treasurer
export const getPendingPayments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const payments = await Payment.find({
      approvalStatus: PaymentApprovalStatus.PENDING,
    })
      .populate({
        path: 'dueId',
        select: 'title amount totalAmount dueDate',
        populate: {
          path: 'dueTypeId',
          select: 'name',
        },
      })
      .populate('pharmacyId', 'name registrationNumber')
      .populate('submittedBy', 'firstName lastName email')
      .sort({ submittedAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Payment.countDocuments({
      approvalStatus: PaymentApprovalStatus.PENDING,
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: payments,
    });
  }
);

// @desc    Approve payment
// @route   PUT /api/payments/:id/approve
// @access  Private/Admin/Financial Secretary/Treasurer
export const approvePayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(
        new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
      );
    }

    if (payment.approvalStatus !== PaymentApprovalStatus.PENDING) {
      return next(
        new ErrorResponse(
          `Payment has already been ${payment.approvalStatus}`,
          400
        )
      );
    }

    // Update payment status
    payment.approvalStatus = PaymentApprovalStatus.APPROVED;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    await payment.save();

    // Update due with payment
    const due = await Due.findById(payment.dueId);
    if (due) {
      due.amountPaid += payment.amount;
      due.balance = due.totalAmount - due.amountPaid;

      // Update payment status based on balance
      if (due.balance <= 0) {
        due.paymentStatus = PaymentStatus.PAID;
      } else if (due.amountPaid > 0) {
        due.paymentStatus = PaymentStatus.PARTIALLY_PAID;
      }

      await due.save();
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate(
        'dueId',
        'title amount totalAmount amountPaid balance paymentStatus'
      )
      .populate('pharmacyId', 'name registrationNumber')
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: populatedPayment,
    });
  }
);

// @desc    Reject payment
// @route   PUT /api/payments/:id/reject
// @access  Private/Admin/Financial Secretary/Treasurer
export const rejectPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return next(new ErrorResponse('Rejection reason is required', 400));
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(
        new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
      );
    }

    if (payment.approvalStatus !== PaymentApprovalStatus.PENDING) {
      return next(
        new ErrorResponse(
          `Payment has already been ${payment.approvalStatus}`,
          400
        )
      );
    }

    // Update payment status
    payment.approvalStatus = PaymentApprovalStatus.REJECTED;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    payment.rejectionReason = rejectionReason;
    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('dueId', 'title amount totalAmount')
      .populate('pharmacyId', 'name registrationNumber')
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: populatedPayment,
    });
  }
);

// @desc    Review payment (approve or reject)
// @route   POST /api/payments/:id/review
// @access  Private/Admin/Financial Secretary/Treasurer
export const reviewPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status, rejectionReason } = req.body;
    const paymentId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return next(
        new ErrorResponse('Status must be either approved or rejected', 400)
      );
    }

    if (status === 'rejected' && !rejectionReason) {
      return next(
        new ErrorResponse(
          'Rejection reason is required when rejecting payment',
          400
        )
      );
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return next(
        new ErrorResponse(`Payment not found with id of ${paymentId}`, 404)
      );
    }

    if (payment.approvalStatus !== PaymentApprovalStatus.PENDING) {
      return next(new ErrorResponse('Payment has already been reviewed', 400));
    }

    // Update payment status
    if (status === 'approved') {
      payment.approvalStatus = PaymentApprovalStatus.APPROVED;
      payment.approvedBy = req.user._id;
      payment.approvedAt = new Date();

      // Update the due with the payment
      const due = await Due.findById(payment.dueId);
      if (due) {
        due.amountPaid += payment.amount;
        due.balance = due.totalAmount - due.amountPaid;

        // Update payment status based on balance
        if (due.balance <= 0) {
          due.paymentStatus = PaymentStatus.PAID;
        } else if (due.amountPaid > 0) {
          due.paymentStatus = PaymentStatus.PARTIALLY_PAID;
        }

        await due.save();
      }
    } else {
      payment.approvalStatus = PaymentApprovalStatus.REJECTED;
      payment.rejectionReason = rejectionReason;
      payment.approvedBy = req.user._id;
      payment.approvedAt = new Date();
    }

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('dueId', 'title amount totalAmount')
      .populate('pharmacyId', 'name registrationNumber')
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: populatedPayment,
    });
  }
);

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin/Superadmin
export const deletePayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(
        new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404)
      );
    }

    // If payment was approved, need to reverse the due payment
    if (payment.approvalStatus === PaymentApprovalStatus.APPROVED) {
      const due = await Due.findById(payment.dueId);
      if (due) {
        due.amountPaid -= payment.amount;
        due.balance = due.totalAmount - due.amountPaid;

        // Update payment status based on new balance
        if (due.amountPaid <= 0) {
          due.paymentStatus = PaymentStatus.PENDING;
        } else if (due.balance <= 0) {
          due.paymentStatus = PaymentStatus.PAID;
        } else {
          due.paymentStatus = PaymentStatus.PARTIALLY_PAID;
        }

        await due.save();
      }
    }

    // Delete receipt from cloudinary
    try {
      await deleteFromCloudinary(payment.receiptPublicId);
    } catch (error) {
      console.error('Error deleting receipt from cloudinary:', error);
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);
