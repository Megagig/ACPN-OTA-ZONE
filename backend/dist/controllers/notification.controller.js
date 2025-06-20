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
exports.createNotificationForCommunication = exports.getNotificationStats = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadNotifications = exports.getNotifications = void 0;
const userNotification_model_1 = __importDefault(require("../models/userNotification.model"));
const communication_model_1 = __importDefault(require("../models/communication.model"));
const communicationRecipient_model_1 = __importDefault(require("../models/communicationRecipient.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const unreadOnly = req.query.unreadOnly === 'true';
    const startIndex = (page - 1) * limit;
    // Build query
    const query = { userId };
    // Filter by type if specified
    if (type) {
        query.type = type;
    }
    // Filter by read status if specified
    if (unreadOnly) {
        query.isRead = false;
    }
    // Only show non-expired notifications
    query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
    ];
    const notifications = yield userNotification_model_1.default.find(query)
        .populate('communicationId', 'subject messageType priority senderUserId sentDate')
        .sort({ priority: -1, createdAt: -1 })
        .skip(startIndex)
        .limit(limit);
    const total = yield userNotification_model_1.default.countDocuments(query);
    const unreadCount = yield userNotification_model_1.default.getUnreadCountForUser(userId.toString());
    res.status(200).json({
        success: true,
        count: notifications.length,
        unreadCount,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: notifications,
    });
}));
// @desc    Get unread notifications for member login
// @route   GET /api/notifications/unread
// @access  Private
exports.getUnreadNotifications = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const notifications = yield userNotification_model_1.default.getUnreadForUser(userId.toString());
    const limitedNotifications = notifications.slice(0, limit);
    // Mark as displayed (but not read) since user is seeing them
    const notificationIds = limitedNotifications.map((n) => n._id);
    yield userNotification_model_1.default.updateMany({ _id: { $in: notificationIds }, isDisplayed: false }, {
        isDisplayed: true,
        displayedAt: new Date(),
    });
    const unreadCount = yield userNotification_model_1.default.getUnreadCountForUser(userId.toString());
    res.status(200).json({
        success: true,
        count: limitedNotifications.length,
        unreadCount,
        data: limitedNotifications,
    });
}));
// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield userNotification_model_1.default.findById(req.params.id);
    if (!notification) {
        return next(new errorResponse_1.default(`Notification not found with id of ${req.params.id}`, 404));
    }
    // Check if notification belongs to the user
    if (notification.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default('Not authorized to mark this notification as read', 403));
    }
    yield notification.markAsRead();
    res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification,
    });
}));
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield userNotification_model_1.default.updateMany({
        userId,
        isRead: false,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: new Date() } },
        ],
    }, {
        isRead: true,
        readAt: new Date(),
    });
    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
        modifiedCount: result.modifiedCount,
    });
}));
// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield userNotification_model_1.default.findById(req.params.id);
    if (!notification) {
        return next(new errorResponse_1.default(`Notification not found with id of ${req.params.id}`, 404));
    }
    // Check if notification belongs to the user
    if (notification.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default('Not authorized to delete this notification', 403));
    }
    yield userNotification_model_1.default.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
    });
}));
// @desc    Get notification stats for dashboard
// @route   GET /api/notifications/stats
// @access  Private
exports.getNotificationStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const [unreadCount, totalCount, typeStats, priorityStats] = yield Promise.all([
        userNotification_model_1.default.getUnreadCountForUser(userId.toString()),
        userNotification_model_1.default.countDocuments({
            userId,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gte: new Date() } },
            ],
        }),
        userNotification_model_1.default.aggregate([
            {
                $match: {
                    userId: userId,
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gte: new Date() } },
                    ],
                },
            },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        userNotification_model_1.default.aggregate([
            {
                $match: {
                    userId: userId,
                    isRead: false,
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gte: new Date() } },
                    ],
                },
            },
            { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
    ]);
    res.status(200).json({
        success: true,
        data: {
            unreadCount,
            totalCount,
            readCount: totalCount - unreadCount,
            typeStats,
            priorityStats,
        },
    });
}));
// @desc    Create notification for communication (Internal use)
// @route   POST /api/notifications/create-for-communication
// @access  Private/Admin
exports.createNotificationForCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { communicationId } = req.body;
    // Get communication details
    const communication = yield communication_model_1.default.findById(communicationId).populate('senderUserId', 'firstName lastName');
    if (!communication) {
        return next(new errorResponse_1.default('Communication not found', 404));
    }
    // Only create notifications for sent communications
    if (communication.status !== 'sent') {
        return next(new errorResponse_1.default('Can only create notifications for sent communications', 400));
    }
    // Get all recipients
    const recipients = yield communicationRecipient_model_1.default.find({
        communicationId: communication._id,
    });
    if (recipients.length === 0) {
        return next(new errorResponse_1.default('No recipients found for this communication', 400));
    }
    // Create notifications for all recipients
    const notifications = recipients.map((recipient) => ({
        userId: recipient.userId,
        communicationId: communication._id,
        type: communication.messageType === 'announcement'
            ? 'announcement'
            : 'communication',
        title: communication.subject,
        message: communication.content.substring(0, 500), // Truncate if too long
        priority: communication.priority || 'normal',
        data: {
            senderName: communication.senderUserId
                ? `${communication.senderUserId.firstName} ${communication.senderUserId.lastName}`
                : 'System',
            messageType: communication.messageType,
            sentDate: communication.sentDate,
        },
        // Set expiration for 30 days from now
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));
    const createdNotifications = yield userNotification_model_1.default.insertMany(notifications);
    // Emit real-time notifications if socket service is available
    if (global.socketService) {
        recipients.forEach((recipient) => {
            const notification = createdNotifications.find((n) => n.userId.toString() === recipient.userId.toString());
            if (notification) {
                global.socketService.emitToUser(recipient.userId.toString(), 'new_notification', notification);
            }
        });
    }
    res.status(201).json({
        success: true,
        message: `Created ${createdNotifications.length} notifications`,
        count: createdNotifications.length,
        data: createdNotifications,
    });
}));
exports.default = {
    getNotifications: exports.getNotifications,
    getUnreadNotifications: exports.getUnreadNotifications,
    markAsRead: exports.markAsRead,
    markAllAsRead: exports.markAllAsRead,
    deleteNotification: exports.deleteNotification,
    getNotificationStats: exports.getNotificationStats,
    createNotificationForCommunication: exports.createNotificationForCommunication,
};
