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
exports.getDuesStats = exports.payDue = exports.deleteDue = exports.updateDue = exports.createDue = exports.getDue = exports.getPharmacyDues = exports.getAllDues = void 0;
const due_model_1 = __importStar(require("../models/due.model"));
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all dues
// @route   GET /api/dues
// @access  Private/Admin
exports.getAllDues = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = {};
    // Filter by payment status if provided
    if (req.query.paymentStatus) {
        query.paymentStatus = req.query.paymentStatus;
    }
    // Filter by year if provided
    if (req.query.year) {
        query.year = parseInt(req.query.year);
    }
    const dues = yield due_model_1.default.find(query)
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
    const total = yield due_model_1.default.countDocuments(query);
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
}));
// @desc    Get dues for a pharmacy
// @route   GET /api/pharmacies/:pharmacyId/dues
// @access  Private
exports.getPharmacyDues = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const pharmacy = yield pharmacy_model_1.default.findById(req.params.pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${req.params.pharmacyId}`, 404));
    }
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access these dues`, 403));
    }
    const dues = yield due_model_1.default.find({ pharmacyId: req.params.pharmacyId }).sort({
        year: -1,
    });
    res.status(200).json({
        success: true,
        count: dues.length,
        data: dues,
    });
}));
// @desc    Get a single due
// @route   GET /api/dues/:id
// @access  Private
exports.getDue = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const due = yield due_model_1.default.findById(req.params.id).populate({
        path: 'pharmacyId',
        select: 'name registrationNumber userId',
    });
    if (!due) {
        return next(new errorResponse_1.default(`Due not found with id of ${req.params.id}`, 404));
    }
    const pharmacy = due.pharmacyId;
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access this due`, 403));
    }
    res.status(200).json({
        success: true,
        data: due,
    });
}));
// @desc    Create a due
// @route   POST /api/pharmacies/:pharmacyId/dues
// @access  Private/Admin/Treasurer
exports.createDue = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.body.pharmacyId = req.params.pharmacyId;
    const pharmacy = yield pharmacy_model_1.default.findById(req.params.pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${req.params.pharmacyId}`, 404));
    }
    // Only admin and treasurer can create dues
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to create dues`, 403));
    }
    // Check if a due already exists for this pharmacy and year
    const existingDue = yield due_model_1.default.findOne({
        pharmacyId: req.params.pharmacyId,
        year: req.body.year,
    });
    if (existingDue) {
        return next(new errorResponse_1.default(`Due already exists for this pharmacy and year`, 400));
    }
    const due = yield due_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: due,
    });
}));
// @desc    Update a due
// @route   PUT /api/dues/:id
// @access  Private/Admin/Treasurer
exports.updateDue = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let due = yield due_model_1.default.findById(req.params.id);
    if (!due) {
        return next(new errorResponse_1.default(`Due not found with id of ${req.params.id}`, 404));
    }
    // Only admin and treasurer can update dues
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update dues`, 403));
    }
    due = yield due_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: due,
    });
}));
// @desc    Delete a due
// @route   DELETE /api/dues/:id
// @access  Private/Admin/Treasurer
exports.deleteDue = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const due = yield due_model_1.default.findById(req.params.id);
    if (!due) {
        return next(new errorResponse_1.default(`Due not found with id of ${req.params.id}`, 404));
    }
    // Only admin and treasurer can delete dues
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete dues`, 403));
    }
    yield due.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Mark a due as paid
// @route   PUT /api/dues/:id/pay
// @access  Private/Admin/Treasurer
exports.payDue = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const due = yield due_model_1.default.findById(req.params.id);
    if (!due) {
        return next(new errorResponse_1.default(`Due not found with id of ${req.params.id}`, 404));
    }
    // Only admin, treasurer, or pharmacy owner can mark dues as paid
    const pharmacy = yield pharmacy_model_1.default.findById(due.pharmacyId);
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        (pharmacy === null || pharmacy === void 0 ? void 0 : pharmacy.userId.toString()) !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to pay this due`, 403));
    }
    due.paymentStatus = due_model_1.PaymentStatus.PAID;
    due.paymentDate = new Date();
    due.paymentReference = req.body.paymentReference || `Manual-${Date.now()}`;
    yield due.save();
    res.status(200).json({
        success: true,
        data: due,
    });
}));
// @desc    Get dues statistics
// @route   GET /api/dues/stats
// @access  Private/Admin/Treasurer
exports.getDuesStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = new Date().getFullYear();
    // Get total dues for current year
    const totalDuesThisYear = yield due_model_1.default.aggregate([
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
    const duesByMonth = yield due_model_1.default.aggregate([
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
}));
