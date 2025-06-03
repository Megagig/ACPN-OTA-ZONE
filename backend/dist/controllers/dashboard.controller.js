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
exports.exportDashboardData = exports.updateSystemSettings = exports.getSystemSettings = exports.getUserManagementStats = exports.getOverviewStats = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const event_model_1 = __importDefault(require("../models/event.model"));
const poll_model_1 = __importDefault(require("../models/poll.model"));
const payment_model_1 = __importDefault(require("../models/payment.model"));
const auditTrail_model_1 = __importDefault(require("../models/auditTrail.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/dashboard/overview
 * @access  Private (Admin, SuperAdmin, Secretary)
 */
exports.getOverviewStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get current date and 30 days ago for recent activity
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Run all queries in parallel for better performance
        const [totalPharmacies, activePharmacies, pendingApprovals, totalUsers, totalEvents, upcomingEvents, totalDuesCollected, totalPolls, activePolls, recentAuditTrails,] = yield Promise.all([
            pharmacy_model_1.default.countDocuments(),
            pharmacy_model_1.default.countDocuments({ isActive: true }),
            user_model_1.default.countDocuments({ status: 'pending' }),
            user_model_1.default.countDocuments(),
            event_model_1.default.countDocuments(),
            event_model_1.default.countDocuments({
                startDate: { $gte: now },
                status: { $in: ['upcoming', 'active'] },
            }),
            payment_model_1.default.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            poll_model_1.default.countDocuments(),
            poll_model_1.default.countDocuments({
                endDate: { $gte: now },
                isActive: true,
            }),
            auditTrail_model_1.default.find({
                createdAt: { $gte: thirtyDaysAgo },
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('userId', 'firstName lastName')
                .lean(),
        ]);
        // Calculate total dues collected
        const duesCollected = totalDuesCollected.length > 0 ? totalDuesCollected[0].total : 0;
        // Calculate outstanding dues (simplified - would need more complex logic based on your business rules)
        const totalExpectedDues = totalUsers * 15000; // Assuming ₦15,000 per user per year
        const totalDuesOutstanding = Math.max(0, totalExpectedDues - duesCollected);
        // Format recent activity
        const recentActivity = recentAuditTrails.map((audit) => {
            var _a, _b, _c;
            let title = '';
            let description = '';
            let status = 'success';
            let type = 'user_registration';
            switch (audit.action) {
                case 'create':
                    if (audit.model === 'User') {
                        title = 'New member registration';
                        description = `${((_a = audit.userId) === null || _a === void 0 ? void 0 : _a.firstName) || 'User'} ${((_b = audit.userId) === null || _b === void 0 ? void 0 : _b.lastName) || ''} registered as a new member`;
                        type = 'user_registration';
                        status = 'success';
                    }
                    else if (audit.model === 'Event') {
                        title = 'New event created';
                        description = 'A new event has been scheduled';
                        type = 'event';
                        status = 'success';
                    }
                    else if (audit.model === 'Poll') {
                        title = 'New poll created';
                        description = 'A new poll has been created';
                        type = 'poll';
                        status = 'success';
                    }
                    break;
                case 'update':
                    if (audit.model === 'Payment') {
                        title = 'Payment processed';
                        description = 'A payment has been successfully processed';
                        type = 'payment';
                        status = 'success';
                    }
                    else if (audit.model === 'Pharmacy') {
                        title = 'Pharmacy updated';
                        description = 'Pharmacy information has been updated';
                        type = 'pharmacy_approval';
                        status = 'success';
                    }
                    break;
                case 'approval':
                    title = 'Pharmacy approved';
                    description = 'A pharmacy has been approved for registration';
                    type = 'pharmacy_approval';
                    status = 'success';
                    break;
                default:
                    title = 'System activity';
                    // Convert details to string if it's an object
                    if (typeof audit.details === 'object' && audit.details !== null) {
                        if (audit.details.oldStatus && audit.details.newStatus) {
                            description = `Status changed from ${audit.details.oldStatus} to ${audit.details.newStatus}`;
                        }
                        else {
                            try {
                                description = JSON.stringify(audit.details);
                            }
                            catch (e) {
                                description = 'System activity details';
                            }
                        }
                    }
                    else {
                        description =
                            ((_c = audit.details) === null || _c === void 0 ? void 0 : _c.toString()) || 'System activity recorded';
                    }
                    type = 'user_registration';
                    status = 'success';
            }
            return {
                id: audit._id.toString(),
                type,
                title,
                description,
                timestamp: audit.createdAt.toISOString(),
                status,
            };
        });
        const stats = {
            totalPharmacies,
            activePharmacies,
            pendingApprovals,
            totalUsers,
            totalEvents,
            upcomingEvents,
            totalDuesCollected: duesCollected,
            totalDuesOutstanding,
            totalPolls,
            activePolls,
            recentActivity,
        };
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error fetching dashboard overview stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard overview statistics',
        });
    }
}));
/**
 * @desc    Get user management statistics
 * @route   GET /api/dashboard/user-management
 * @access  Private (Admin, SuperAdmin)
 */
exports.getUserManagementStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const [totalUsers, activeUsers, pendingUsers, suspendedUsers, usersByRole, recentRegistrations, userActivity,] = yield Promise.all([
            user_model_1.default.countDocuments(),
            user_model_1.default.countDocuments({ status: 'active' }),
            user_model_1.default.countDocuments({ status: 'pending' }),
            user_model_1.default.countDocuments({ status: 'suspended' }),
            user_model_1.default.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $project: { role: '$_id', count: 1, _id: 0 } },
            ]),
            user_model_1.default.countDocuments({
                createdAt: { $gte: lastMonth },
            }),
            user_model_1.default.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(now.getFullYear() - 1, 0, 1) },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        month: {
                            $concat: [
                                { $toString: '$_id.year' },
                                '-',
                                { $toString: '$_id.month' },
                            ],
                        },
                        count: 1,
                        _id: 0,
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);
        const stats = {
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            usersByRole,
            recentRegistrations,
            userActivity,
        };
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error fetching user management stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user management statistics',
        });
    }
}));
/**
 * @desc    Get system settings
 * @route   GET /api/dashboard/settings
 * @access  Private (Admin, SuperAdmin)
 */
exports.getSystemSettings = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // In a real application, these would come from a settings model or configuration
        // For now, we'll return default/mock settings
        const settings = {
            siteName: 'ACPN Ota Zone',
            siteDescription: 'Association of Community Pharmacists of Nigeria - Ota Zone',
            adminEmail: 'admin@acpn-ota.org',
            enableRegistration: true,
            enableEmailNotifications: true,
            enableSMSNotifications: false,
            maintenanceMode: false,
            maxFileUploadSize: 5, // MB
            allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
            autoApprovalEnabled: false,
            sessionTimeout: 30, // minutes
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialChars: false,
            },
        };
        res.status(200).json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system settings',
        });
    }
}));
/**
 * @desc    Update system settings
 * @route   PUT /api/dashboard/settings
 * @access  Private (SuperAdmin only)
 */
exports.updateSystemSettings = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = req.body;
        // In a real application, you would validate and save these to a settings model
        // For now, we'll just return success
        res.status(200).json({
            success: true,
            message: 'System settings updated successfully',
            data: updates,
        });
    }
    catch (error) {
        console.error('Error updating system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update system settings',
        });
    }
}));
/**
 * @desc    Export dashboard data
 * @route   GET /api/dashboard/export/:type
 * @access  Private (Admin, SuperAdmin)
 */
exports.exportDashboardData = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        let data;
        let filename;
        switch (type) {
            case 'users':
                data = yield user_model_1.default.find({}, { password: 0, __v: 0 }).lean();
                filename = `users-export-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'pharmacies':
                data = yield pharmacy_model_1.default.find({}, { __v: 0 }).lean();
                filename = `pharmacies-export-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'events':
                data = yield event_model_1.default.find({}, { __v: 0 }).lean();
                filename = `events-export-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'payments':
                data = yield payment_model_1.default.find({}, { __v: 0 }).lean();
                filename = `payments-export-${new Date().toISOString().split('T')[0]}.json`;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type',
                });
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).json({
            success: true,
            data,
            exportedAt: new Date().toISOString(),
            type,
        });
    }
    catch (error) {
        console.error('Error exporting dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
        });
    }
}));
