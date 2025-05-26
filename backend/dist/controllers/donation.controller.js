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
exports.getDonationStats = exports.acknowledgeDonation = exports.deleteDonation = exports.updateDonation = exports.createDonation = exports.getDonation = exports.getPharmacyDonations = exports.getAllDonations = void 0;
const donation_model_1 = __importStar(require("../models/donation.model"));
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all donations
// @route   GET /api/donations
// @access  Private/Admin/Treasurer
exports.getAllDonations = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = {};
    // Filter by acknowledgment status if provided
    if (req.query.acknowledgmentStatus) {
        query.acknowledgmentStatus = req.query.acknowledgmentStatus;
    }
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
        query.donationDate = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(req.query.endDate),
        };
    }
    // Filter by purpose if provided
    if (req.query.purpose) {
        query.purpose = { $regex: req.query.purpose, $options: 'i' };
    }
    const donations = yield donation_model_1.default.find(query)
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
        .sort({ donationDate: -1 });
    // Get total count
    const total = yield donation_model_1.default.countDocuments(query);
    res.status(200).json({
        success: true,
        count: donations.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: donations,
    });
}));
// @desc    Get donations for a pharmacy
// @route   GET /api/pharmacies/:pharmacyId/donations
// @access  Private
exports.getPharmacyDonations = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const pharmacy = yield pharmacy_model_1.default.findById(req.params.pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${req.params.pharmacyId}`, 404));
    }
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access these donations`, 403));
    }
    const donations = yield donation_model_1.default.find({
        pharmacyId: req.params.pharmacyId,
    }).sort({
        donationDate: -1,
    });
    res.status(200).json({
        success: true,
        count: donations.length,
        data: donations,
    });
}));
// @desc    Get a single donation
// @route   GET /api/donations/:id
// @access  Private
exports.getDonation = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield donation_model_1.default.findById(req.params.id).populate({
        path: 'pharmacyId',
        select: 'name registrationNumber userId',
    });
    if (!donation) {
        return next(new errorResponse_1.default(`Donation not found with id of ${req.params.id}`, 404));
    }
    const pharmacy = donation.pharmacyId;
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access this donation`, 403));
    }
    res.status(200).json({
        success: true,
        data: donation,
    });
}));
// @desc    Create a donation
// @route   POST /api/pharmacies/:pharmacyId/donations
// @access  Private
exports.createDonation = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.body.pharmacyId = req.params.pharmacyId;
    const pharmacy = yield pharmacy_model_1.default.findById(req.params.pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${req.params.pharmacyId}`, 404));
    }
    // Check if user is the pharmacy owner or admin/treasurer
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to create donations for this pharmacy`, 403));
    }
    const donation = yield donation_model_1.default.create(req.body);
    res.status(201).json({
        success: true,
        data: donation,
    });
}));
// @desc    Update a donation
// @route   PUT /api/donations/:id
// @access  Private/Admin/Treasurer
exports.updateDonation = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let donation = yield donation_model_1.default.findById(req.params.id);
    if (!donation) {
        return next(new errorResponse_1.default(`Donation not found with id of ${req.params.id}`, 404));
    }
    // Only admin and treasurer can update donations
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update donations`, 403));
    }
    donation = yield donation_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: donation,
    });
}));
// @desc    Delete a donation
// @route   DELETE /api/donations/:id
// @access  Private/Admin/Treasurer
exports.deleteDonation = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const donation = yield donation_model_1.default.findById(req.params.id);
    if (!donation) {
        return next(new errorResponse_1.default(`Donation not found with id of ${req.params.id}`, 404));
    }
    // Only admin and treasurer can delete donations
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete donations`, 403));
    }
    yield donation.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Acknowledge a donation
// @route   PUT /api/donations/:id/acknowledge
// @access  Private/Admin/Treasurer
exports.acknowledgeDonation = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let donation = yield donation_model_1.default.findById(req.params.id);
    if (!donation) {
        return next(new errorResponse_1.default(`Donation not found with id of ${req.params.id}`, 404));
    }
    // Only admin and treasurer can acknowledge donations
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to acknowledge donations`, 403));
    }
    donation = yield donation_model_1.default.findByIdAndUpdate(req.params.id, { acknowledgmentStatus: donation_model_1.AcknowledgmentStatus.ACKNOWLEDGED }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: donation,
    });
}));
// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private/Admin/Treasurer
exports.getDonationStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin and treasurer can view donation statistics
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer') {
        throw new errorResponse_1.default(`User ${req.user._id} is not authorized to view donation statistics`, 403);
    }
    // Get total donations
    const totalAmount = yield donation_model_1.default.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    // Get donations by purpose
    const byPurpose = yield donation_model_1.default.aggregate([
        {
            $group: {
                _id: '$purpose',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { total: -1 } },
    ]);
    // Get monthly donations (for current year)
    const currentYear = new Date().getFullYear();
    const monthlyDonations = yield donation_model_1.default.aggregate([
        {
            $match: {
                donationDate: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$donationDate' },
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    // Get pending vs acknowledged donations
    const byStatus = yield donation_model_1.default.aggregate([
        {
            $group: {
                _id: '$acknowledgmentStatus',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
    ]);
    res.status(200).json({
        success: true,
        data: {
            totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
            byPurpose,
            monthlyDonations,
            byStatus,
        },
    });
}));
