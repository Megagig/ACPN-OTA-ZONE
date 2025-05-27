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
exports.getPharmacyPaymentHistory = exports.getOverdueDues = exports.getDuesByType = exports.markDueAsPaid = exports.generateClearanceCertificate = exports.getPharmacyDueAnalytics = exports.getDueAnalytics = exports.addPenaltyToDue = exports.assignDueToPharmacy = exports.bulkAssignDues = exports.assignDues = exports.getDuesStats = exports.payDue = exports.deleteDue = exports.updateDue = exports.createDue = exports.getDue = exports.getPharmacyDues = exports.getAllDues = void 0;
const due_model_1 = __importStar(require("../models/due.model"));
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
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
    // Check if populate query param is present
    const populateFields = req.query.populate
        ? String(req.query.populate).split(',')
        : [];
    // Build the base query
    let dueQuery = due_model_1.default.find(query).populate({
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
    const dues = yield dueQuery
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
    // Check if populate query param is present
    const populateFields = req.query.populate
        ? String(req.query.populate).split(',')
        : [];
    // Build query
    let query = due_model_1.default.find({ pharmacyId: req.params.pharmacyId });
    // Apply population if requested
    if (populateFields.includes('dueTypeId') || req.query.populate === 'true') {
        query = query.populate('dueTypeId');
    }
    // Sort by year in descending order
    query = query.sort({ year: -1 });
    const dues = yield query;
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
    const due = yield due_model_1.default.findById(req.params.id)
        .populate({
        path: 'pharmacyId',
        select: 'name registrationNumber userId',
    })
        .populate('dueTypeId');
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
    due.amountPaid = due.totalAmount; // Mark as fully paid
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
// @desc    Assign dues to pharmacies (bulk or individual)
// @route   POST /api/dues/assign
// @access  Private/Admin/Financial Secretary/Treasurer
exports.assignDues = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { dueTypeId, title, description, amount, dueDate, assignmentType, pharmacyIds, // For individual assignment
    isRecurring, nextDueDate, } = req.body;
    // Validate required fields
    if (!dueTypeId || !title || !amount || !dueDate || !assignmentType) {
        return next(new errorResponse_1.default('Please provide all required fields', 400));
    }
    const year = new Date(dueDate).getFullYear();
    const assignedBy = req.user._id;
    const assignedAt = new Date();
    let targetPharmacies = [];
    if (assignmentType === 'bulk') {
        // Get all active pharmacies
        const pharmacies = yield pharmacy_model_1.default.find({
            registrationStatus: 'active',
        }).select('_id');
        targetPharmacies = pharmacies.map((p) => p._id.toString());
    }
    else if (assignmentType === 'individual') {
        if (!pharmacyIds ||
            !Array.isArray(pharmacyIds) ||
            pharmacyIds.length === 0) {
            return next(new errorResponse_1.default('Pharmacy IDs are required for individual assignment', 400));
        }
        targetPharmacies = pharmacyIds;
    }
    else {
        return next(new errorResponse_1.default('Invalid assignment type', 400));
    }
    const createdDues = [];
    const errors = [];
    // Create dues for each pharmacy
    for (const pharmacyId of targetPharmacies) {
        try {
            // Check if due already exists for this pharmacy, due type, and year
            const existingDue = yield due_model_1.default.findOne({
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
            const due = yield due_model_1.default.create(dueData);
            createdDues.push(due);
        }
        catch (error) {
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
}));
// @desc    Bulk assign dues to multiple pharmacies
// @route   POST /api/dues/bulk-assign
// @access  Private/Admin/Treasurer/Financial Secretary
exports.bulkAssignDues = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dueTypeId, amount, dueDate, description, pharmacyIds } = req.body;
    if (!dueTypeId ||
        !amount ||
        !dueDate ||
        !pharmacyIds ||
        pharmacyIds.length === 0) {
        throw new errorResponse_1.default('Please provide all required fields', 400);
    }
    const dues = [];
    const dueYear = new Date(dueDate).getFullYear();
    const failedAssignments = [];
    for (const pharmacyId of pharmacyIds) {
        try {
            // Check if pharmacy exists
            const pharmacy = yield pharmacy_model_1.default.findById(pharmacyId);
            if (!pharmacy) {
                failedAssignments.push({
                    pharmacyId,
                    error: 'Pharmacy not found',
                });
                continue;
            }
            try {
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
                const due = yield due_model_1.default.findOneAndUpdate({
                    pharmacyId,
                    dueTypeId,
                    year: dueYear,
                }, updateData, {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                });
                dues.push(due);
            }
            catch (error) {
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
        }
        catch (error) {
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
        failedAssignments: failedAssignments.length > 0 ? failedAssignments : undefined,
    });
}));
// @desc    Assign due to specific pharmacy
// @route   POST /api/dues/assign/:pharmacyId
// @access  Private/Admin/Treasurer/Financial Secretary
exports.assignDueToPharmacy = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dueTypeId, amount, dueDate, description, title, isRecurring, recurringFrequency, } = req.body;
    const { pharmacyId } = req.params;
    const pharmacy = yield pharmacy_model_1.default.findById(pharmacyId);
    if (!pharmacy) {
        throw new errorResponse_1.default('Pharmacy not found', 404);
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
        const due = yield due_model_1.default.findOneAndUpdate({
            pharmacyId,
            dueTypeId,
            year: dueYear,
        }, updateData, {
            new: true, // Return the updated document
            upsert: true, // Create if it doesn't exist
            runValidators: true, // Run validators for update
            setDefaultsOnInsert: true, // Apply defaults on insert
        });
        // Populate references
        const populatedDue = yield due_model_1.default.findOne({
            pharmacyId,
            dueTypeId,
            year: dueYear,
        }).populate('dueTypeId pharmacyId');
    }
    catch (error) {
        // If there's a duplicate key error (11000), provide a more specific message
        if (error.code === 11000) {
            throw new errorResponse_1.default(`A due for this pharmacy of the same type already exists for ${dueYear}. Please try again.`, 400);
        }
        throw error; // Re-throw any other errors
    }
    const populatedDue = yield due_model_1.default.findOne({
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
                yield due_model_1.default.findOneAndUpdate({
                    pharmacyId,
                    dueTypeId,
                    year: nextDueDate.getFullYear(),
                }, {
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
                }, {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                });
            }
            catch (error) {
                console.error(`Error creating recurring due for year ${nextDueDate.getFullYear()}:`, error);
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
}));
// @desc    Add penalty to a due
// @route   POST /api/dues/:id/penalty
// @access  Private/Admin/Treasurer/Financial Secretary
exports.addPenaltyToDue = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount, reason } = req.body;
    const due = yield due_model_1.default.findById(req.params.id);
    if (!due) {
        throw new errorResponse_1.default('Due not found', 404);
    }
    due.penalties.push({
        amount,
        reason,
        addedBy: req.user._id,
        addedAt: new Date(),
    });
    yield due.save();
    res.status(200).json({
        success: true,
        data: due,
    });
}));
// @desc    Get comprehensive dues analytics
// @route   GET /api/dues/analytics/all
// @access  Private/Admin/Treasurer/Financial Secretary
exports.getDueAnalytics = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.year) || currentYear;
    const analytics = yield due_model_1.default.aggregate([
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
    const duesByType = yield due_model_1.default.aggregate([
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
}));
// @desc    Get pharmacy-specific analytics
// @route   GET /api/dues/analytics/pharmacy/:pharmacyId
// @access  Private
exports.getPharmacyDueAnalytics = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pharmacyId } = req.params;
    const currentYear = new Date().getFullYear();
    // Check authorization
    const pharmacy = yield pharmacy_model_1.default.findById(pharmacyId);
    if (!pharmacy) {
        throw new errorResponse_1.default('Pharmacy not found', 404);
    }
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        throw new errorResponse_1.default('Not authorized to view this data', 403);
    }
    const analytics = yield due_model_1.default.aggregate([
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
}));
// @desc    Generate clearance certificate
// @route   GET /api/dues/:id/certificate
// @access  Private
exports.generateClearanceCertificate = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const due = yield due_model_1.default.findById(req.params.id)
        .populate('pharmacyId')
        .populate('dueTypeId');
    if (!due) {
        throw new errorResponse_1.default('Due not found', 404);
    }
    if (due.paymentStatus !== due_model_1.PaymentStatus.PAID) {
        throw new errorResponse_1.default('Due must be fully paid to generate certificate', 400);
    }
    // For now, return certificate data - PDF generation can be added later
    const certificateData = {
        pharmacyName: due.pharmacyId.name,
        dueType: due.dueTypeId.name,
        amount: due.totalAmount,
        paidDate: due.updatedAt,
        validUntil: new Date(new Date().getFullYear(), 11, 31), // Dec 31st of current year
        certificateNumber: `CERT-${due._id}-${Date.now()}`,
    };
    res.status(200).json({
        success: true,
        data: certificateData,
    });
}));
// @desc    Mark due as paid manually
// @route   PUT /api/dues/:id/mark-paid
// @access  Private/Admin/Treasurer/Financial Secretary
exports.markDueAsPaid = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const due = yield due_model_1.default.findById(req.params.id);
    if (!due) {
        throw new errorResponse_1.default('Due not found', 404);
    }
    due.amountPaid = due.totalAmount;
    due.paymentStatus = due_model_1.PaymentStatus.PAID;
    yield due.save();
    res.status(200).json({
        success: true,
        data: due,
    });
}));
// @desc    Get dues by type
// @route   GET /api/dues/type/:typeId
// @access  Private/Admin/Treasurer/Financial Secretary
exports.getDuesByType = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { typeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const dues = yield due_model_1.default.find({ dueTypeId: typeId })
        .populate('pharmacyId', 'name registrationNumber')
        .populate('dueTypeId', 'name description')
        .skip(startIndex)
        .limit(limit)
        .sort({ dueDate: -1 });
    const total = yield due_model_1.default.countDocuments({ dueTypeId: typeId });
    res.status(200).json({
        success: true,
        count: dues.length,
        pagination: { page, limit, total },
        data: dues,
    });
}));
// @desc    Get overdue dues
// @route   GET /api/dues/overdue
// @access  Private/Admin/Treasurer/Financial Secretary
exports.getOverdueDues = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentDate = new Date();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const query = {
        dueDate: { $lt: currentDate },
        paymentStatus: { $ne: due_model_1.PaymentStatus.PAID },
    };
    const dues = yield due_model_1.default.find(query)
        .populate('pharmacyId', 'name registrationNumber')
        .populate('dueTypeId', 'name description')
        .skip(startIndex)
        .limit(limit)
        .sort({ dueDate: 1 }); // Oldest first
    const total = yield due_model_1.default.countDocuments(query);
    res.status(200).json({
        success: true,
        count: dues.length,
        pagination: { page, limit, total },
        data: dues,
    });
}));
// @desc    Get pharmacy payment history
// @route   GET /api/dues/pharmacy/:pharmacyId/history
// @access  Private
exports.getPharmacyPaymentHistory = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pharmacyId } = req.params;
    const pharmacy = yield pharmacy_model_1.default.findById(pharmacyId);
    if (!pharmacy) {
        throw new errorResponse_1.default('Pharmacy not found', 404);
    }
    // Check authorization
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        throw new errorResponse_1.default('Not authorized to view this data', 403);
    }
    // First, get all payments for this pharmacy from Payment model
    const payments = yield payment_model_1.default.find({ pharmacyId })
        .populate('dueId')
        .sort({ createdAt: -1 });
    // Also get all dues to include those without payments
    const dues = yield due_model_1.default.find({ pharmacyId })
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
}));
