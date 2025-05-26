import { Request, Response, NextFunction } from 'express';
import Payment, { PaymentApprovalStatus } from '../models/payment.model';
import Due from '../models/due.model';
import Pharmacy from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import cloudinary from '../config/cloudinary/cloudinary';

// @desc    Submit payment for a due
// @route   POST /api/pharmacies/:pharmacyId/dues/:dueId/payments
// @access  Private/Pharmacy Owner
export const submitPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { pharmacyId, dueId } = req.params;
    const { amount, paymentMethod, paymentReference } = req.body;

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
    if (amount <= 0) {
      return next(
        new ErrorResponse('Payment amount must be greater than 0', 400)
      );
    }

    if (amount > due.balance) {
      return next(
        new ErrorResponse(
          `Payment amount (${amount}) exceeds outstanding balance (${due.balance})`,
          400
        )
      );
    }

    // Handle receipt upload
    if (!req.files || !req.files.receipt) {
      return next(new ErrorResponse('Receipt upload is required', 400));
    }

    const receiptFile = Array.isArray(req.files.receipt)
      ? req.files.receipt[0]
      : req.files.receipt;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    if (!allowedTypes.includes(receiptFile.mimetype)) {
      return next(
        new ErrorResponse(
          'Please upload a valid receipt file (JPEG, JPG, PNG, or PDF)',
          400
        )
      );
    }

    try {
      // Upload receipt to cloudinary
      const result = await cloudinary.uploadToCloudinary(
        receiptFile,
        'payment-receipts'
      );

      // Create payment record
      const payment = await Payment.create({
        dueId,
        pharmacyId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentReference,
        receiptUrl: result.secure_url,
        receiptPublicId: result.public_id,
        submittedBy: req.user._id,
        approvalStatus: PaymentApprovalStatus.PENDING,
      });

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
      return next(
        new ErrorResponse('Error processing payment submission', 500)
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
      await due.save(); // Pre-save middleware will calculate balance and status
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
        await due.save();
      }
    }

    // Delete receipt from cloudinary
    try {
      await cloudinary.deleteFromCloudinary(payment.receiptPublicId);
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
