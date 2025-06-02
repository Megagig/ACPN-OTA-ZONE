"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.reviewPayment = exports.rejectPayment = exports.approvePayment = exports.getPendingPayments = exports.getAllPayments = exports.getDuePayments = exports.submitPayment = void 0;
const payment_model_1 = __importStar(require("../models/payment.model"));
const due_model_1 = __importStar(require("../models/due.model"));
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const cloudinary_1 = require("../config/cloudinary");
// @desc    Submit payment for a due
// @route   POST /api/payments/submit
// @access  Private
exports.submitPayment = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { dueId, pharmacyId, amount, paymentMethod, paymentReference } = req.body;
    if (!dueId || !pharmacyId || !amount) {
        return next(new errorResponse_1.default('Missing required fields for payment submission', 400));
    }
    // Check if pharmacy exists and user owns it
    const pharmacy = yield pharmacy_model_1.default.findById(pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${pharmacyId}`, 404));
    }
    // Check authorization
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to submit payment for this pharmacy`, 403));
    }
    // Check if due exists
    const due = yield due_model_1.default.findById(dueId);
    if (!due) {
        return next(new errorResponse_1.default(`Due not found with id of ${dueId}`, 404));
    }
    // Check if due belongs to the pharmacy
    if (due.pharmacyId.toString() !== pharmacyId) {
        return next(new errorResponse_1.default('Due does not belong to this pharmacy', 400));
    }
    // Validate payment amount
    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
        return next(new errorResponse_1.default('Payment amount must be greater than 0', 400));
    }
    if (parsedAmount > due.balance) {
        return next(new errorResponse_1.default(`Payment amount (${parsedAmount}) exceeds outstanding balance (${due.balance})`, 400));
    }
    // Handle receipt upload with multer (req.file instead of req.files)
    if (!req.file) {
        return next(new errorResponse_1.default('Receipt upload is required', 400));
    }
    // Validate file type
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return next(new errorResponse_1.default('Please upload a valid receipt file (JPEG, JPG, PNG, or PDF)', 400));
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
                return next(new errorResponse_1.default('Receipt file is missing or invalid', 400));
            }
            console.log('Complete file object:', JSON.stringify(req.file, null, 2));
            // Make sure we have a valid path - Multer may use different properties
            const filePath = req.file.path ||
                req.file.destination + '/' + req.file.filename;
            // Upload to Cloudinary if available
            if (typeof cloudinary_1.uploadToCloudinary === 'function') {
                console.log('Uploading to Cloudinary:', filePath);
                const result = yield (0, cloudinary_1.uploadToCloudinary)(filePath, 'payment-receipts');
                receiptUrl = result.secure_url;
                receiptPublicId = result.public_id;
                console.log('Cloudinary upload successful:', {
                    receiptUrl,
                    receiptPublicId,
                });
            }
            else {
                // Fallback if Cloudinary is not available
                // Use static route path for receipts
                receiptUrl = `/static/receipts/${req.file.filename}`;
                receiptPublicId = req.file.filename;
                console.log('Using local file path:', receiptUrl);
            }
        }
        catch (uploadError) {
            console.error('Error uploading to Cloudinary:', uploadError);
            // Fallback to local path
            if (req.file && req.file.filename) {
                receiptUrl = `/static/receipts/${req.file.filename}`;
                receiptPublicId = req.file.filename;
                console.log('Fallback to local path after error:', receiptUrl);
            }
            else {
                return next(new errorResponse_1.default('Failed to process receipt upload', 500));
            }
        }
        // Create payment record
        console.log('Creating payment record with:', {
            dueId,
            pharmacyId,
            amount: parseFloat(amount),
            receiptUrl,
            userId: req.user._id,
        });
        const payment = yield payment_model_1.default.create({
            dueId,
            pharmacyId,
            amount: parseFloat(amount),
            paymentMethod,
            paymentReference,
            receiptUrl,
            receiptPublicId,
            submittedBy: req.user._id,
            approvalStatus: payment_model_1.PaymentApprovalStatus.PENDING,
            paymentDate: new Date(),
        });
        console.log('Payment created successfully:', payment._id);
        const populatedPayment = yield payment_model_1.default.findById(payment._id)
            .populate('dueId', 'title amount totalAmount')
            .populate('pharmacyId', 'name registrationNumber')
            .populate('submittedBy', 'firstName lastName email');
        res.status(201).json({
            success: true,
            data: populatedPayment,
        });
    }
    catch (error) {
        console.error('Error submitting payment:', error);
        // Provide more detailed error information
        const errorMessage = error instanceof Error
            ? `${error.name}: ${error.message}`
            : 'Unknown error processing payment';
        console.error(errorMessage);
        return next(new errorResponse_1.default(`Error processing payment submission: ${errorMessage}`, 500));
    }
}));
// @desc    Get payments for a due
// @route   GET /api/pharmacies/:pharmacyId/dues/:dueId/payments
// @access  Private/Pharmacy Owner/Admin
exports.getDuePayments = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { pharmacyId, dueId } = req.params;
    // Check authorization
    const pharmacy = yield pharmacy_model_1.default.findById(pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${pharmacyId}`, 404));
    }
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        req.user.role !== 'financial_secretary' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to view payments for this pharmacy`, 403));
    }
    const payments = yield payment_model_1.default.find({ dueId, pharmacyId })
        .populate('submittedBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email')
        .sort({ submittedAt: -1 });
    res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
    });
}));
// @desc    Get all payments with filters for admin
// @route   GET /api/payments/admin/all
// @access  Private/Admin/Financial Secretary/Treasurer
exports.getAllPayments = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const status = req.query.status;
    let filter = {};
    if (status && status !== 'all') {
        filter.approvalStatus = status;
    }
    const payments = yield payment_model_1.default.find(filter)
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
    const total = yield payment_model_1.default.countDocuments(filter);
    res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}));
// @desc    Get all pending payments for admin review
// @route   GET /api/payments/pending
// @access  Private/Admin/Financial Secretary/Treasurer
exports.getPendingPayments = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const payments = yield payment_model_1.default.find({
        approvalStatus: payment_model_1.PaymentApprovalStatus.PENDING,
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
    const total = yield payment_model_1.default.countDocuments({
        approvalStatus: payment_model_1.PaymentApprovalStatus.PENDING,
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
}));
// @desc    Approve payment
// @route   PUT /api/payments/:id/approve
// @access  Private/Admin/Financial Secretary/Treasurer
exports.approvePayment = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.default.findById(req.params.id);
    if (!payment) {
        return next(new errorResponse_1.default(`Payment not found with id of ${req.params.id}`, 404));
    }
    if (payment.approvalStatus !== payment_model_1.PaymentApprovalStatus.PENDING) {
        return next(new errorResponse_1.default(`Payment has already been ${payment.approvalStatus}`, 400));
    }
    // Update payment status
    payment.approvalStatus = payment_model_1.PaymentApprovalStatus.APPROVED;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    yield payment.save();
    // Update due with payment
    const due = yield due_model_1.default.findById(payment.dueId);
    if (due) {
        due.amountPaid += payment.amount;
        due.balance = due.totalAmount - due.amountPaid;
        // Update payment status based on balance
        if (due.balance <= 0) {
            due.paymentStatus = due_model_1.PaymentStatus.PAID;
        }
        else if (due.amountPaid > 0) {
            due.paymentStatus = due_model_1.PaymentStatus.PARTIALLY_PAID;
        }
        yield due.save();
    }
    const populatedPayment = yield payment_model_1.default.findById(payment._id)
        .populate('dueId', 'title amount totalAmount amountPaid balance paymentStatus')
        .populate('pharmacyId', 'name registrationNumber')
        .populate('submittedBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: populatedPayment,
    });
}));
// @desc    Reject payment
// @route   PUT /api/payments/:id/reject
// @access  Private/Admin/Financial Secretary/Treasurer
exports.rejectPayment = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        return next(new errorResponse_1.default('Rejection reason is required', 400));
    }
    const payment = yield payment_model_1.default.findById(req.params.id);
    if (!payment) {
        return next(new errorResponse_1.default(`Payment not found with id of ${req.params.id}`, 404));
    }
    if (payment.approvalStatus !== payment_model_1.PaymentApprovalStatus.PENDING) {
        return next(new errorResponse_1.default(`Payment has already been ${payment.approvalStatus}`, 400));
    }
    // Update payment status
    payment.approvalStatus = payment_model_1.PaymentApprovalStatus.REJECTED;
    payment.approvedBy = req.user._id;
    payment.approvedAt = new Date();
    payment.rejectionReason = rejectionReason;
    yield payment.save();
    const populatedPayment = yield payment_model_1.default.findById(payment._id)
        .populate('dueId', 'title amount totalAmount')
        .populate('pharmacyId', 'name registrationNumber')
        .populate('submittedBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: populatedPayment,
    });
}));
// @desc    Review payment (approve or reject)
// @route   POST /api/payments/:id/review
// @access  Private/Admin/Financial Secretary/Treasurer
exports.reviewPayment = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, rejectionReason } = req.body;
    const paymentId = req.params.id;
    if (!['approved', 'rejected'].includes(status)) {
        return next(new errorResponse_1.default('Status must be either approved or rejected', 400));
    }
    if (status === 'rejected' && !rejectionReason) {
        return next(new errorResponse_1.default('Rejection reason is required when rejecting payment', 400));
    }
    const payment = yield payment_model_1.default.findById(paymentId);
    if (!payment) {
        return next(new errorResponse_1.default(`Payment not found with id of ${paymentId}`, 404));
    }
    if (payment.approvalStatus !== payment_model_1.PaymentApprovalStatus.PENDING) {
        return next(new errorResponse_1.default('Payment has already been reviewed', 400));
    }
    // Update payment status
    if (status === 'approved') {
        payment.approvalStatus = payment_model_1.PaymentApprovalStatus.APPROVED;
        payment.approvedBy = req.user._id;
        payment.approvedAt = new Date();
        // Update the due with the payment
        const due = yield due_model_1.default.findById(payment.dueId);
        if (due) {
            due.amountPaid += payment.amount;
            due.balance = due.totalAmount - due.amountPaid;
            // Update payment status based on balance
            if (due.balance <= 0) {
                due.paymentStatus = due_model_1.PaymentStatus.PAID;
            }
            else if (due.amountPaid > 0) {
                due.paymentStatus = due_model_1.PaymentStatus.PARTIALLY_PAID;
            }
            yield due.save();
        }
    }
    else {
        payment.approvalStatus = payment_model_1.PaymentApprovalStatus.REJECTED;
        payment.rejectionReason = rejectionReason;
        payment.approvedBy = req.user._id;
        payment.approvedAt = new Date();
    }
    yield payment.save();
    const populatedPayment = yield payment_model_1.default.findById(payment._id)
        .populate('dueId', 'title amount totalAmount')
        .populate('pharmacyId', 'name registrationNumber')
        .populate('submittedBy', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: populatedPayment,
    });
}));
// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin/Superadmin
exports.deletePayment = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.default.findById(req.params.id);
    if (!payment) {
        return next(new errorResponse_1.default(`Payment not found with id of ${req.params.id}`, 404));
    }
    // If payment was approved, need to reverse the due payment
    if (payment.approvalStatus === payment_model_1.PaymentApprovalStatus.APPROVED) {
        const due = yield due_model_1.default.findById(payment.dueId);
        if (due) {
            due.amountPaid -= payment.amount;
            due.balance = due.totalAmount - due.amountPaid;
            // Update payment status based on new balance
            if (due.amountPaid <= 0) {
                due.paymentStatus = due_model_1.PaymentStatus.PENDING;
            }
            else if (due.balance <= 0) {
                due.paymentStatus = due_model_1.PaymentStatus.PAID;
            }
            else {
                due.paymentStatus = due_model_1.PaymentStatus.PARTIALLY_PAID;
            }
            yield due.save();
        }
    }
    // Delete receipt from cloudinary
    try {
        yield (0, cloudinary_1.deleteFromCloudinary)(payment.receiptPublicId);
    }
    catch (error) {
        console.error('Error deleting receipt from cloudinary:', error);
    }
    yield payment.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
