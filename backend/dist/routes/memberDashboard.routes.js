"use strict";
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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const event_model_1 = __importDefault(require("../models/event.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const due_model_1 = __importDefault(require("../models/due.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const cache_middleware_1 = require("../middleware/cache.middleware");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.protect);
// Get member dashboard overview stats
router.get('/overview', (0, cache_middleware_1.cacheMiddleware)('member-dashboard', { ttl: 300 }), // Cache for 5 minutes
(0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get the current user
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        // Find the pharmacy associated with this user
        const pharmacy = yield pharmacy_model_1.default.findOne({
            userId: typeof userId === 'string'
                ? new mongoose_1.default.Types.ObjectId(userId)
                : userId,
        });
        const pharmacyId = pharmacy === null || pharmacy === void 0 ? void 0 : pharmacy._id;
        // Get current date and 30 days ago for upcoming events and recent activity
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Get dues data for the user/pharmacy
        let financialSummary = {
            totalDue: 0,
            totalPaid: 0,
            remainingBalance: 0,
        };
        let attendanceSummary = {
            attended: 0,
            missed: 0,
        };
        let recentActivity = [];
        if (pharmacyId) {
            try {
                // Get financial data
                const [dues, payments] = yield Promise.all([
                    due_model_1.default.find({ pharmacyId }),
                    payment_model_1.default.find({ pharmacyId }),
                ]);
                // Calculate financial summary
                const totalDue = dues.reduce((sum, due) => sum + due.amount, 0);
                const totalPaid = payments
                    .filter((payment) => payment.approvalStatus === 'approved')
                    .reduce((sum, payment) => sum + payment.amount, 0);
                financialSummary = {
                    totalDue,
                    totalPaid,
                    remainingBalance: totalDue - totalPaid,
                };
                // Get recent activity
                const recentPayments = yield payment_model_1.default.find({ pharmacyId })
                    .sort({ createdAt: -1 })
                    .limit(5);
                recentActivity = recentPayments.map((payment) => {
                    // Cast the document to ensure _id is properly typed
                    const typedPayment = payment;
                    return {
                        id: typedPayment._id.toString(),
                        type: 'payment',
                        title: 'Payment Submitted',
                        description: `Payment of ₦${typedPayment.amount} submitted`,
                        timestamp: typedPayment.createdAt,
                        status: typedPayment.approvalStatus === 'approved'
                            ? 'success'
                            : typedPayment.approvalStatus === 'rejected'
                                ? 'error'
                                : 'pending',
                    };
                });
            }
            catch (dbError) {
                console.error('Error querying pharmacy data:', dbError);
                // If there's an error, we'll continue with default values
            }
        }
        // Get upcoming events
        let upcomingEvents = 0;
        try {
            upcomingEvents = yield event_model_1.default.find({
                startDate: { $gte: now },
                status: 'published',
            }).countDocuments();
        }
        catch (eventError) {
            console.error('Error fetching upcoming events:', eventError);
            // If there's an error, we'll continue with default value of 0
        }
        return res.status(200).json({
            success: true,
            data: {
                userFinancialSummary: financialSummary,
                userAttendanceSummary: attendanceSummary,
                upcomingEvents,
                recentActivity,
            },
        });
    }
    catch (error) {
        console.error('Error fetching member dashboard stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.stack
                    : null
                : undefined,
        });
    }
})));
// Get member's payments
router.get('/payments', (0, cache_middleware_1.cacheMiddleware)('member-payments', { ttl: 180 }), // Cache for 3 minutes
(0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Find the pharmacy associated with this user
        const pharmacy = yield pharmacy_model_1.default.findOne({
            userId: typeof userId === 'string'
                ? new mongoose_1.default.Types.ObjectId(userId)
                : userId,
        });
        if (!pharmacy) {
            return res.status(200).json({
                success: true,
                data: {
                    payments: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            });
        }
        const pharmacyId = pharmacy._id;
        try {
            // Get the total count for pagination
            const total = yield payment_model_1.default.countDocuments({ pharmacyId });
            // Get the payments
            const payments = yield payment_model_1.default.find({ pharmacyId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('dueId', 'title description amount dueDate');
            return res.status(200).json({
                success: true,
                data: {
                    payments,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        }
        catch (dbError) {
            console.error('Error querying payments data:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Error retrieving payment data',
                error: dbError instanceof Error
                    ? dbError.message
                    : 'Unknown database error',
            });
        }
    }
    catch (error) {
        console.error('Error fetching member payments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.stack
                    : null
                : undefined,
        });
    }
})));
exports.default = router;
