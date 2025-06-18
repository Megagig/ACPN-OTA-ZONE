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
exports.getCommunicationRecipients = exports.scheduleCommunication = exports.updateCommunication = exports.sendCommunication = exports.getCommunicationStats = exports.deleteCommunication = exports.markAsRead = exports.createCommunication = exports.getCommunication = exports.getUserSentCommunications = exports.getUserInbox = exports.getAllAdminCommunications = void 0;
const communication_model_1 = __importStar(require("../models/communication.model"));
const communicationRecipient_model_1 = __importDefault(require("../models/communicationRecipient.model"));
const userNotification_model_1 = __importDefault(require("../models/userNotification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all communications (admin view)
// @route   GET /api/communications/admin
// @access  Private/Admin/Secretary
exports.getAllAdminCommunications = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin and secretary can view all communications
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to view all communications`, 403));
    }
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Build query
    const query = {};
    // Filter by message type if provided
    if (req.query.messageType) {
        query.messageType = req.query.messageType;
    }
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
        query.sentDate = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(req.query.endDate),
        };
    }
    // Search by subject or content
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        query.$or = [{ subject: searchRegex }, { content: searchRegex }];
    }
    const communications = yield communication_model_1.default.find(query)
        .populate({
        path: 'senderUserId',
        select: 'firstName lastName email',
    })
        .skip(startIndex)
        .limit(limit)
        .sort({ sentDate: -1 });
    // Get total count
    const total = yield communication_model_1.default.countDocuments(query);
    // For each communication, get recipient count
    const communicationsWithCounts = yield Promise.all(communications.map((communication) => __awaiter(void 0, void 0, void 0, function* () {
        const recipientCount = yield communicationRecipient_model_1.default.countDocuments({
            communicationId: communication._id,
        });
        const readCount = yield communicationRecipient_model_1.default.countDocuments({
            communicationId: communication._id,
            readStatus: true,
        });
        const communicationObj = communication.toObject();
        return Object.assign(Object.assign({}, communicationObj), { recipientCount,
            readCount, readPercentage: recipientCount > 0
                ? Math.round((readCount / recipientCount) * 100)
                : 0 });
    })));
    res.status(200).json({
        success: true,
        count: communications.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: communicationsWithCounts,
    });
}));
// @desc    Get user's inbox
// @route   GET /api/communications/inbox
// @access  Private
exports.getUserInbox = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Get all communications where the user is a recipient
    const recipientRecords = yield communicationRecipient_model_1.default.find({
        userId: req.user._id,
    })
        .populate({
        path: 'communicationId',
        populate: {
            path: 'senderUserId',
            select: 'firstName lastName email',
        },
    })
        .sort({ 'communicationId.sentDate': -1 })
        .skip(startIndex)
        .limit(limit);
    // Get total count
    const total = yield communicationRecipient_model_1.default.countDocuments({
        userId: req.user._id,
    });
    // Format the response
    const inbox = recipientRecords.map((record) => {
        const communication = record.communicationId;
        return {
            _id: communication._id,
            subject: communication.subject,
            content: communication.content,
            sentDate: communication.sentDate,
            messageType: communication.messageType,
            attachmentUrl: communication.attachmentUrl,
            sender: communication.senderUserId,
            readStatus: record.readStatus,
            readTime: record.readTime,
        };
    });
    // Get unread count
    const unreadCount = yield communicationRecipient_model_1.default.countDocuments({
        userId: req.user._id,
        readStatus: false,
    });
    res.status(200).json({
        success: true,
        count: inbox.length,
        unreadCount,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: inbox,
    });
}));
// @desc    Get user's sent communications
// @route   GET /api/communications/sent
// @access  Private
exports.getUserSentCommunications = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    // Get all communications sent by the user
    const communications = yield communication_model_1.default.find({
        senderUserId: req.user._id,
    })
        .sort({ sentDate: -1 })
        .skip(startIndex)
        .limit(limit);
    // Get total count
    const total = yield communication_model_1.default.countDocuments({
        senderUserId: req.user._id,
    });
    // For each communication, get recipient count and read count
    const sentItems = yield Promise.all(communications.map((communication) => __awaiter(void 0, void 0, void 0, function* () {
        const recipientCount = yield communicationRecipient_model_1.default.countDocuments({
            communicationId: communication._id,
        });
        const readCount = yield communicationRecipient_model_1.default.countDocuments({
            communicationId: communication._id,
            readStatus: true,
        });
        const communicationObj = communication.toObject();
        return Object.assign(Object.assign({}, communicationObj), { recipientCount,
            readCount, readPercentage: recipientCount > 0
                ? Math.round((readCount / recipientCount) * 100)
                : 0 });
    })));
    res.status(200).json({
        success: true,
        count: sentItems.length,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        },
        data: sentItems,
    });
}));
// @desc    Get single communication
// @route   GET /api/communications/:id
// @access  Private
exports.getCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const communication = yield communication_model_1.default.findById(req.params.id).populate({
        path: 'senderUserId',
        select: 'firstName lastName email',
    });
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Check if user is the sender, an admin, or a recipient
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender = communication.senderUserId.toString() === req.user._id.toString();
    const recipientRecord = yield communicationRecipient_model_1.default.findOne({
        communicationId: communication._id,
        userId: req.user._id,
    });
    const isRecipient = !!recipientRecord;
    if (!isAdmin && !isSender && !isRecipient) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to view this communication`, 403));
    }
    // If user is a recipient, mark as read if not already
    if (isRecipient && recipientRecord && !recipientRecord.readStatus) {
        recipientRecord.readStatus = true;
        recipientRecord.readTime = new Date();
        yield recipientRecord.save();
    }
    // Get recipients if admin or sender
    let recipients = [];
    if (isAdmin || isSender) {
        recipients = yield communicationRecipient_model_1.default.find({
            communicationId: communication._id,
        })
            .populate({
            path: 'userId',
            select: 'firstName lastName email',
        })
            .sort({ readStatus: 1, createdAt: 1 });
    }
    res.status(200).json({
        success: true,
        data: {
            communication,
            recipientRecord: isRecipient ? recipientRecord : null,
            recipients: isAdmin || isSender ? recipients : [],
        },
    });
}));
// @desc    Create new communication
// @route   POST /api/communications
// @access  Private/Admin/Secretary
exports.createCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate if user can send messages
    if (req.body.messageType === communication_model_1.MessageType.ANNOUNCEMENT &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to send announcements`, 403));
    }
    if (req.body.messageType === communication_model_1.MessageType.NEWSLETTER &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to send newsletters`, 403));
    }
    // Add sender to req.body
    req.body.senderUserId = req.user._id;
    // Create the communication
    const communication = yield communication_model_1.default.create(Object.assign(Object.assign({}, req.body), { senderUserId: req.user._id, status: communication_model_1.CommunicationStatus.DRAFT }));
    // Add recipients based on recipientType
    let recipientUsers = [];
    if (req.body.recipientType === communication_model_1.RecipientType.ALL) {
        // Add all users as recipients
        recipientUsers = yield user_model_1.default.find({ isActive: true }).select('_id');
    }
    else if (req.body.recipientType === communication_model_1.RecipientType.ADMIN) {
        // Add only admin users as recipients
        recipientUsers = yield user_model_1.default.find({
            isActive: true,
            role: { $in: ['admin', 'superadmin', 'secretary', 'treasurer'] },
        }).select('_id');
    }
    else if (req.body.recipientType === communication_model_1.RecipientType.SPECIFIC) {
        // Add only specific users as recipients
        if (!req.body.recipientIds ||
            !Array.isArray(req.body.recipientIds) ||
            req.body.recipientIds.length === 0) {
            return next(new errorResponse_1.default(`Recipient IDs are required for specific recipient type`, 400));
        }
        // Validate all recipients exist
        const existingUsers = yield user_model_1.default.find({
            _id: { $in: req.body.recipientIds },
            isActive: true,
        }).select('_id');
        if (existingUsers.length !== req.body.recipientIds.length) {
            return next(new errorResponse_1.default(`Some recipient IDs are invalid`, 400));
        }
        // Save specific recipients to the communication document
        communication.specificRecipients = existingUsers.map((user) => user._id);
        yield communication.save();
        recipientUsers = existingUsers;
    }
    // Batch create recipient records
    if (recipientUsers.length > 0) {
        const recipientRecords = recipientUsers.map((user) => ({
            communicationId: communication._id,
            userId: user._id,
            readStatus: false,
        }));
        yield communicationRecipient_model_1.default.insertMany(recipientRecords);
    }
    res.status(201).json({
        success: true,
        data: Object.assign(Object.assign({}, communication.toObject()), { recipientCount: recipientUsers.length }),
    });
}));
// @desc    Mark communication as read
// @route   PUT /api/communications/:id/read
// @access  Private
exports.markAsRead = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const communication = yield communication_model_1.default.findById(req.params.id);
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Find recipient record
    const recipientRecord = yield communicationRecipient_model_1.default.findOne({
        communicationId: communication._id,
        userId: req.user._id,
    });
    if (!recipientRecord) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not a recipient of this communication`, 404));
    }
    // Update read status
    recipientRecord.readStatus = true;
    recipientRecord.readTime = new Date();
    yield recipientRecord.save();
    res.status(200).json({
        success: true,
        data: recipientRecord,
    });
}));
// @desc    Delete communication
// @route   DELETE /api/communications/:id
// @access  Private/Admin
exports.deleteCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const communication = yield communication_model_1.default.findById(req.params.id);
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Check if user is admin or the sender
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isSender = communication.senderUserId.toString() === req.user._id.toString();
    if (!isAdmin && !isSender) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete this communication`, 403));
    }
    // Delete all recipient records first
    yield communicationRecipient_model_1.default.deleteMany({
        communicationId: communication._id,
    });
    // Then delete the communication
    yield communication.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Get communication statistics
// @route   GET /api/communications/stats
// @access  Private/Admin
exports.getCommunicationStats = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admin can view communication statistics
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        throw new errorResponse_1.default(`User ${req.user._id} is not authorized to view communication statistics`, 403);
    }
    // Get total counts by message type
    const messageTypeCounts = yield communication_model_1.default.aggregate([
        { $group: { _id: '$messageType', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Get counts by status
    const statusCounts = yield communication_model_1.default.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    // Get monthly communication counts (for current year)
    const currentYear = new Date().getFullYear();
    const monthlyCommunications = yield communication_model_1.default.aggregate([
        {
            $match: {
                sentDate: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$sentDate' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    // Get read rate statistics
    const readRateStats = yield communicationRecipient_model_1.default.aggregate([
        {
            $group: {
                _id: 'total',
                totalRecipients: { $sum: 1 },
                totalRead: {
                    $sum: { $cond: [{ $eq: ['$readStatus', true] }, 1, 0] },
                },
            },
        },
    ]);
    // Get read rate by communication type
    const readRateByType = yield communicationRecipient_model_1.default.aggregate([
        {
            $lookup: {
                from: 'communications',
                localField: 'communicationId',
                foreignField: '_id',
                as: 'communication',
            },
        },
        { $unwind: '$communication' },
        {
            $group: {
                _id: '$communication.messageType',
                totalRecipients: { $sum: 1 },
                totalRead: {
                    $sum: { $cond: [{ $eq: ['$readStatus', true] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                messageType: '$_id',
                totalRecipients: 1,
                totalRead: 1,
                readRate: {
                    $multiply: [{ $divide: ['$totalRead', '$totalRecipients'] }, 100],
                },
            },
        },
        { $sort: { messageType: 1 } },
    ]);
    // Recent communications
    const recentCommunications = yield communication_model_1.default.find()
        .populate({
        path: 'senderUserId',
        select: 'firstName lastName',
    })
        .select('subject messageType sentDate senderUserId')
        .sort({ sentDate: -1 })
        .limit(5);
    res.status(200).json({
        success: true,
        data: {
            messageTypeCounts,
            statusCounts,
            monthlyCommunications,
            readRateStats: readRateStats.length > 0
                ? {
                    totalRecipients: readRateStats[0].totalRecipients,
                    totalRead: readRateStats[0].totalRead,
                    readRate: readRateStats[0].totalRecipients > 0
                        ? Math.round((readRateStats[0].totalRead /
                            readRateStats[0].totalRecipients) *
                            100)
                        : 0,
                }
                : {
                    totalRecipients: 0,
                    totalRead: 0,
                    readRate: 0,
                },
            readRateByType,
            recentCommunications,
        },
    });
}));
// @desc    Send a draft communication
// @route   POST /api/communications/:id/send
// @access  Private/Admin/Secretary
exports.sendCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const communication = yield communication_model_1.default.findById(req.params.id);
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Authorization checks
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender = communication.senderUserId.toString() === req.user._id.toString();
    if (!isAdmin && !isSender) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to send this communication`, 403));
    }
    if (communication.status !== 'draft') {
        return next(new errorResponse_1.default(`Communication is already ${communication.status}`, 400));
    }
    try {
        // 1. Determine recipient users
        let recipientUsers = [];
        const userQuery = { isActive: true };
        switch (communication.recipientType) {
            case communication_model_1.RecipientType.ALL:
                recipientUsers = yield user_model_1.default.find(userQuery).select('_id');
                break;
            case communication_model_1.RecipientType.ADMIN:
                userQuery.role = { $in: ['admin', 'superadmin', 'secretary', 'treasurer'] };
                recipientUsers = yield user_model_1.default.find(userQuery).select('_id');
                break;
            case communication_model_1.RecipientType.SPECIFIC:
                if ((_a = communication.specificRecipients) === null || _a === void 0 ? void 0 : _a.length) {
                    userQuery._id = { $in: communication.specificRecipients };
                    recipientUsers = yield user_model_1.default.find(userQuery).select('_id');
                }
                break;
        }
        // 2. Update communication status and save
        communication.status = 'sent';
        communication.sentDate = new Date();
        yield communication.save();
        let createdNotifications = [];
        // 3. Process recipients and notifications
        if (recipientUsers.length > 0) {
            const recipientIds = recipientUsers.map((user) => user._id);
            // Create recipient records in bulk, ensuring a clean slate
            yield communicationRecipient_model_1.default.deleteMany({ communicationId: communication._id });
            const recipientRecords = recipientIds.map((userId) => ({
                communicationId: communication._id,
                userId: userId,
            }));
            yield communicationRecipient_model_1.default.insertMany(recipientRecords);
            // Create notifications in bulk
            const sender = yield user_model_1.default.findById(communication.senderUserId).select('firstName lastName');
            const senderInfo = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'System';
            const notificationsToCreate = recipientIds.map((userId) => ({
                userId: userId,
                type: 'communication',
                title: `New Communication: ${communication.subject}`,
                message: `You have received a new communication from ${senderInfo}.`,
                priority: communication.priority || 'normal',
                referenceId: communication._id,
                referenceModel: 'Communication',
            }));
            yield userNotification_model_1.default.deleteMany({ referenceId: communication._id, referenceModel: 'Communication' });
            createdNotifications = yield userNotification_model_1.default.insertMany(notificationsToCreate);
        }
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Communication sent successfully',
            data: {
                communication,
                recipientCount: recipientUsers.length,
                notificationCount: createdNotifications.length,
            },
        });
    }
    catch (error) {
        console.error('Error sending communication:', error);
        return next(new errorResponse_1.default(`Error sending communication: ${error.message}`, 500));
    }
}));
// @desc    Update a communication
// @route   PUT /api/communications/:id
// @access  Private
exports.updateCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let communication = yield communication_model_1.default.findById(req.params.id);
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Check if user is authorized to update
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender = communication.senderUserId.toString() === req.user._id.toString();
    if (!isAdmin && !isSender) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update this communication`, 403));
    }
    // Check if communication can be updated (only in draft status)
    if (communication.status !== 'draft') {
        return next(new errorResponse_1.default(`Cannot update a communication that has been ${communication.status}`, 400));
    }
    // Handle specific recipients update
    if (req.body.recipientType === 'specific' &&
        req.body.recipientIds &&
        Array.isArray(req.body.recipientIds)) {
        // Validate all recipients exist
        const existingUsers = yield user_model_1.default.find({
            _id: { $in: req.body.recipientIds },
            isActive: true,
        }).select('_id');
        if (existingUsers.length !== req.body.recipientIds.length) {
            return next(new errorResponse_1.default(`Some recipient IDs are invalid`, 400));
        }
        // Update specific recipients
        req.body.specificRecipients = existingUsers.map((user) => user._id);
    }
    // Update communication
    communication = yield communication_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: communication,
    });
}));
// @desc    Schedule a communication for later sending
// @route   POST /api/communications/:id/schedule
// @access  Private
exports.scheduleCommunication = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let communication = yield communication_model_1.default.findById(req.params.id);
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Check if user is authorized to schedule
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender = communication.senderUserId.toString() === req.user._id.toString();
    if (!isAdmin && !isSender) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to schedule this communication`, 403));
    }
    // Check if communication is in draft status
    if (communication.status !== 'draft') {
        return next(new errorResponse_1.default(`Communication is already ${communication.status}`, 400));
    }
    // Validate scheduled date
    const { scheduledDate } = req.body;
    if (!scheduledDate) {
        return next(new errorResponse_1.default('Scheduled date is required', 400));
    }
    const scheduledFor = new Date(scheduledDate);
    if (scheduledFor <= new Date()) {
        return next(new errorResponse_1.default('Scheduled date must be in the future', 400));
    }
    // Update communication status and scheduled date
    communication.status = 'scheduled';
    communication.scheduledFor = scheduledFor;
    yield communication.save();
    // Create recipients for scheduled communication (same logic as sending)
    let recipients = [];
    if (communication.recipientType === communication_model_1.RecipientType.ALL) {
        // Get all active users
        const allUsers = yield user_model_1.default.find({ isActive: true }).select('_id');
        recipients = allUsers.map((user) => ({
            communicationId: communication._id,
            userId: user._id,
        }));
    }
    else if (communication.recipientType === communication_model_1.RecipientType.ADMIN) {
        // Get all admin users
        const adminUsers = yield user_model_1.default.find({
            role: { $in: ['admin', 'superadmin', 'secretary'] },
            isActive: true,
        }).select('_id');
        recipients = adminUsers.map((user) => ({
            communicationId: communication._id,
            userId: user._id,
        }));
    }
    else if (communication.recipientType === communication_model_1.RecipientType.SPECIFIC) {
        // Use specific recipients
        if (communication.specificRecipients &&
            communication.specificRecipients.length > 0) {
            recipients = communication.specificRecipients.map((userId) => ({
                communicationId: communication._id,
                userId: userId,
            }));
        }
    }
    // Clear existing recipients and create new ones for scheduled communication
    yield communicationRecipient_model_1.default.deleteMany({
        communicationId: communication._id,
    });
    if (recipients.length > 0) {
        yield communicationRecipient_model_1.default.insertMany(recipients);
    }
    res.status(200).json({
        success: true,
        message: `Communication scheduled for ${scheduledFor.toISOString()}`,
        data: communication,
    });
}));
// @desc    Get recipients of a communication
// @route   GET /api/communications/:id/recipients
// @access  Private
exports.getCommunicationRecipients = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const communication = yield communication_model_1.default.findById(req.params.id);
    if (!communication) {
        return next(new errorResponse_1.default(`Communication not found with id of ${req.params.id}`, 404));
    }
    // Authorization check
    const isAdmin = ['admin', 'superadmin', 'secretary'].includes(req.user.role);
    const isSender = communication.senderUserId.toString() === req.user._id.toString();
    if (!isAdmin && !isSender) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to view recipients for this communication`, 403));
    }
    // Get recipients with populated user details
    const recipients = yield communicationRecipient_model_1.default.find({
        communicationId: req.params.id,
    })
        .populate({
        path: 'userId',
        select: 'firstName lastName email role',
    })
        .sort({ createdAt: 1 });
    // Transform data for the frontend, ensuring a 'user' property exists
    const transformedRecipients = recipients
        .filter(r => r.userId) // Ensure user exists
        .map(r => {
        const recipientObj = r.toObject();
        return Object.assign(Object.assign({}, recipientObj), { user: recipientObj.userId });
    });
    res.status(200).json({
        success: true,
        data: transformedRecipients,
    });
}));
