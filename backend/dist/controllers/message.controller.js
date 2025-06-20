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
exports.deleteThread = exports.updateNotificationSettings = exports.updateParticipantRole = exports.markThreadAsRead = exports.markMessageAsRead = exports.deleteMessage = exports.searchUsers = exports.leaveThread = exports.addParticipants = exports.getThreadParticipants = exports.sendMessage = exports.createThread = exports.getThread = exports.getUserThreads = void 0;
const messageThread_model_1 = __importDefault(require("../models/messageThread.model"));
const threadMessage_model_1 = __importDefault(require("../models/threadMessage.model"));
const threadParticipant_model_1 = __importDefault(require("../models/threadParticipant.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// @desc    Get all threads for current user
// @route   GET /api/messages/threads
// @access  Private
exports.getUserThreads = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    // Get threads where user is a participant
    const threads = yield messageThread_model_1.default.find({
        participants: userId,
        isActive: true,
    })
        .populate('participants', 'firstName lastName email profileImage')
        .populate('lastMessageBy', 'firstName lastName')
        .sort({ lastMessageAt: -1 })
        .skip(startIndex)
        .limit(limit);
    // For each thread, get unread message count
    const threadsWithUnreadCount = yield Promise.all(threads.map((thread) => __awaiter(void 0, void 0, void 0, function* () {
        // Find user's last read time for this thread
        const participant = yield threadParticipant_model_1.default.findOne({
            threadId: thread._id,
            userId,
        });
        let unreadCount = 0;
        if (participant === null || participant === void 0 ? void 0 : participant.lastReadAt) {
            unreadCount = yield threadMessage_model_1.default.countDocuments({
                threadId: thread._id,
                createdAt: { $gt: participant.lastReadAt },
                senderId: { $ne: userId },
                isDeleted: false,
            });
        }
        else {
            // If no lastReadAt, count all messages not sent by user
            unreadCount = yield threadMessage_model_1.default.countDocuments({
                threadId: thread._id,
                senderId: { $ne: userId },
                isDeleted: false,
            });
        }
        return Object.assign(Object.assign({}, thread.toObject()), { unreadCount });
    })));
    const total = yield messageThread_model_1.default.countDocuments({
        participants: userId,
        isActive: true,
    });
    res.status(200).json({
        success: true,
        count: threads.length,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: threadsWithUnreadCount,
    });
}));
// @desc    Get single thread with messages
// @route   GET /api/messages/threads/:id
// @access  Private
exports.getThread = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.id;
    // Check if user is participant in this thread
    const participant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    if (!participant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    // Get thread details
    const thread = yield messageThread_model_1.default.findById(threadId)
        .populate('participants', 'firstName lastName email profileImage')
        .populate('createdBy', 'firstName lastName');
    if (!thread || !thread.isActive) {
        return next(new errorResponse_1.default('Thread not found', 404));
    }
    // Get messages for this thread
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const messages = yield threadMessage_model_1.default.find({
        threadId,
        isDeleted: false,
    })
        .populate('senderId', 'firstName lastName profileImage')
        .populate('replyTo')
        .sort({ createdAt: 1 })
        .skip(startIndex)
        .limit(limit);
    // Update user's last read time
    yield threadParticipant_model_1.default.findOneAndUpdate({ threadId, userId }, { lastReadAt: new Date() }, { new: true });
    // Mark messages as read by this user
    yield threadMessage_model_1.default.updateMany({
        threadId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
    }, {
        $push: {
            readBy: {
                userId,
                readAt: new Date(),
            },
        },
    });
    res.status(200).json({
        success: true,
        data: {
            thread: thread.toObject(),
            messages,
            pagination: {
                page,
                limit,
                total: yield threadMessage_model_1.default.countDocuments({
                    threadId,
                    isDeleted: false,
                }),
            },
        },
    });
}));
// @desc    Create new thread
// @route   POST /api/messages/threads
// @access  Private
exports.createThread = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { subject, participants, message, threadType = 'direct' } = req.body;
    if (!subject || !message || !participants || participants.length === 0) {
        return next(new errorResponse_1.default('Subject, message, and participants are required', 400));
    }
    // Validate participants exist
    const participantUsers = yield user_model_1.default.find({
        _id: { $in: participants },
        isActive: true,
    });
    if (participantUsers.length !== participants.length) {
        return next(new errorResponse_1.default('Some participants not found', 400));
    }
    // Add creator to participants if not already included
    const allParticipants = [...new Set([userId, ...participants])];
    // Check if direct thread already exists between these participants
    if (threadType === 'direct' && allParticipants.length === 2) {
        const existingThread = yield messageThread_model_1.default.findOne({
            participants: { $all: allParticipants, $size: 2 },
            threadType: 'direct',
            isActive: true,
        });
        if (existingThread) {
            return next(new errorResponse_1.default('Direct conversation already exists', 400));
        }
    }
    // Create thread
    const thread = yield messageThread_model_1.default.create({
        subject,
        participants: allParticipants,
        createdBy: userId,
        threadType,
        isGroup: allParticipants.length > 2,
    });
    // Create participant records
    const participantRecords = allParticipants.map((participantId) => ({
        threadId: thread._id,
        userId: participantId,
        addedBy: userId,
        role: participantId === userId ? 'admin' : 'participant',
    }));
    yield threadParticipant_model_1.default.insertMany(participantRecords);
    // Create first message
    const firstMessage = yield threadMessage_model_1.default.create({
        threadId: thread._id,
        senderId: userId,
        content: message,
        messageType: 'text',
    });
    // Update thread with last message info
    yield messageThread_model_1.default.findByIdAndUpdate(thread._id, {
        lastMessage: message,
        lastMessageAt: firstMessage.createdAt,
        lastMessageBy: userId,
    });
    // Populate thread details
    const populatedThread = yield messageThread_model_1.default.findById(thread._id)
        .populate('participants', 'firstName lastName email profileImage')
        .populate('createdBy', 'firstName lastName');
    res.status(201).json({
        success: true,
        data: {
            thread: populatedThread,
            firstMessage,
        },
    });
}));
// @desc    Send message to thread
// @route   POST /api/messages/threads/:id/messages
// @access  Private
exports.sendMessage = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.id;
    const { content, messageType = 'text', replyTo } = req.body;
    if (!content) {
        return next(new errorResponse_1.default('Message content is required', 400));
    }
    // Check if user is participant in this thread
    const participant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    if (!participant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    // Verify thread exists and is active
    const thread = yield messageThread_model_1.default.findById(threadId);
    if (!thread || !thread.isActive) {
        return next(new errorResponse_1.default('Thread not found', 404));
    }
    // Create message
    const message = yield threadMessage_model_1.default.create({
        threadId,
        senderId: userId,
        content,
        messageType,
        replyTo: replyTo || undefined,
    });
    // Update thread with last message info
    yield messageThread_model_1.default.findByIdAndUpdate(threadId, {
        lastMessage: content.substring(0, 100), // Truncate for preview
        lastMessageAt: message.createdAt,
        lastMessageBy: userId,
    });
    // Populate message details
    const populatedMessage = yield threadMessage_model_1.default.findById(message._id)
        .populate('senderId', 'firstName lastName profileImage').populate('replyTo');
    // Emit real-time message to thread participants
    if (global.socketService) {
        global.socketService.emitToThread(threadId, 'new_message', {
            message: populatedMessage,
            threadId,
            senderId: userId,
        });
    }
    res.status(201).json({
        success: true,
        data: populatedMessage,
    });
}));
// @desc    Get thread participants
// @route   GET /api/messages/threads/:id/participants
// @access  Private
exports.getThreadParticipants = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.id;
    // Check if user is participant in this thread
    const userParticipant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    if (!userParticipant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    // Get all participants
    const participants = yield threadParticipant_model_1.default.find({
        threadId,
        isActive: true,
    }).populate('userId', 'firstName lastName email profileImage');
    res.status(200).json({
        success: true,
        data: participants,
    });
}));
// @desc    Add participants to thread
// @route   POST /api/messages/threads/:id/participants
// @access  Private
exports.addParticipants = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.id;
    const { participants } = req.body;
    if (!participants || participants.length === 0) {
        return next(new errorResponse_1.default('Participants list is required', 400));
    }
    // Check if user is admin participant in this thread
    const userParticipant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    if (!userParticipant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    // Get thread to check if it's a group
    const thread = yield messageThread_model_1.default.findById(threadId);
    if (!thread) {
        return next(new errorResponse_1.default('Thread not found', 404));
    }
    // Validate new participants exist
    const newParticipants = yield user_model_1.default.find({
        _id: { $in: participants },
        isActive: true,
    });
    if (newParticipants.length !== participants.length) {
        return next(new errorResponse_1.default('Some participants not found', 400));
    }
    // Check which participants are not already in the thread
    const existingParticipants = yield threadParticipant_model_1.default.find({
        threadId,
        userId: { $in: participants },
    });
    const existingParticipantIds = existingParticipants.map((p) => p.userId.toString());
    const newParticipantIds = participants.filter((id) => !existingParticipantIds.includes(id));
    if (newParticipantIds.length === 0) {
        return next(new errorResponse_1.default('All specified users are already participants', 400));
    }
    // Create participant records
    const participantRecords = newParticipantIds.map((participantId) => ({
        threadId,
        userId: participantId,
        addedBy: userId,
        role: 'participant',
    }));
    yield threadParticipant_model_1.default.insertMany(participantRecords);
    // Update thread participants array
    yield messageThread_model_1.default.findByIdAndUpdate(threadId, {
        $addToSet: { participants: { $each: newParticipantIds } },
        isGroup: true, // Ensure it's marked as group if adding participants
    });
    // Create system message about added participants
    const addedUserNames = newParticipants
        .filter((user) => newParticipantIds.includes(user._id.toString()))
        .map((user) => `${user.firstName} ${user.lastName}`)
        .join(', ');
    yield threadMessage_model_1.default.create({
        threadId,
        senderId: userId,
        content: `Added ${addedUserNames} to the conversation`,
        messageType: 'system',
    });
    res.status(200).json({
        success: true,
        message: 'Participants added successfully',
    });
}));
// @desc    Leave thread
// @route   DELETE /api/messages/threads/:id/participants
// @access  Private
exports.leaveThread = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.id;
    // Check if user is participant in this thread
    const participant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    if (!participant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    // Mark participant as inactive
    yield threadParticipant_model_1.default.findByIdAndUpdate(participant._id, {
        isActive: false,
        leftAt: new Date(),
    });
    // Remove user from thread participants array
    yield messageThread_model_1.default.findByIdAndUpdate(threadId, {
        $pull: { participants: userId },
    });
    // Create system message
    const user = yield user_model_1.default.findById(userId);
    yield threadMessage_model_1.default.create({
        threadId,
        senderId: userId,
        content: `${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName} left the conversation`,
        messageType: 'system',
    });
    res.status(200).json({
        success: true,
        message: 'Left thread successfully',
    });
}));
// @desc    Search users for messaging
// @route   GET /api/messages/users/search
// @access  Private
exports.searchUsers = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q } = req.query;
    const userId = req.user.id;
    if (!q || typeof q !== 'string') {
        res.status(200).json({
            success: true,
            data: [],
        });
        return;
    }
    const searchRegex = new RegExp(q, 'i');
    const users = yield user_model_1.default.find({
        $and: [
            { _id: { $ne: userId } }, // Exclude current user
            { isActive: true },
            {
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                ],
            },
        ],
    })
        .select('firstName lastName email profileImage role')
        .limit(20);
    res.status(200).json({
        success: true,
        data: users,
    });
}));
// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const messageId = req.params.messageId;
    const message = yield threadMessage_model_1.default.findById(messageId);
    if (!message) {
        return next(new errorResponse_1.default('Message not found', 404));
    }
    // Check if user is the sender or admin
    const isAdmin = req.user.role === 'admin' ||
        req.user.role === 'superadmin';
    if (message.senderId.toString() !== userId && !isAdmin) {
        return next(new errorResponse_1.default('Not authorized to delete this message', 403));
    }
    // Mark message as deleted
    yield threadMessage_model_1.default.findByIdAndUpdate(messageId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
    });
    res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
    });
}));
// @desc    Mark message as read
// @route   PATCH /api/messages/messages/:id/read
// @access  Private
exports.markMessageAsRead = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const messageId = req.params.messageId;
    const message = yield threadMessage_model_1.default.findById(messageId);
    if (!message) {
        return next(new errorResponse_1.default('Message not found', 404));
    }
    // Check if user is participant in this thread
    const participant = yield threadParticipant_model_1.default.findOne({
        threadId: message.threadId,
        userId,
        isActive: true,
    });
    if (!participant) {
        return next(new errorResponse_1.default('Access denied', 403));
    }
    // Add user to readBy array if not already there
    const alreadyRead = message.readBy.some((read) => read.userId.toString() === userId);
    if (!alreadyRead) {
        message.readBy.push({
            userId,
            readAt: new Date(),
        });
        yield message.save();
    }
    res.status(200).json({
        success: true,
        message: 'Message marked as read',
    });
}));
// @desc    Mark all messages in thread as read
// @route   PATCH /api/messages/threads/:id/read
// @access  Private
exports.markThreadAsRead = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.threadId;
    // Check if user is participant in this thread
    const participant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    if (!participant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    // Update participant's last read time
    participant.lastReadAt = new Date();
    yield participant.save();
    // Mark all unread messages in this thread as read
    yield threadMessage_model_1.default.updateMany({
        threadId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
    }, {
        $push: {
            readBy: {
                userId,
                readAt: new Date(),
            },
        },
    });
    res.status(200).json({
        success: true,
        message: 'Thread marked as read',
    });
}));
// @desc    Update participant role
// @route   PATCH /api/messages/threads/:threadId/participants/:userId/role
// @access  Private
exports.updateParticipantRole = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requesterId = req.user.id;
    const { threadId, userId } = req.params;
    const { role } = req.body;
    // Check if requester is admin of this thread
    const requesterParticipant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId: requesterId,
        isActive: true,
        role: 'admin',
    });
    if (!requesterParticipant) {
        return next(new errorResponse_1.default('Access denied - admin role required', 403));
    }
    // Update participant role
    const participant = yield threadParticipant_model_1.default.findOneAndUpdate({ threadId, userId, isActive: true }, { role }, { new: true });
    if (!participant) {
        return next(new errorResponse_1.default('Participant not found', 404));
    }
    res.status(200).json({
        success: true,
        message: 'Participant role updated successfully',
        data: participant,
    });
}));
// @desc    Update notification settings
// @route   PATCH /api/messages/threads/:threadId/participants/:userId/notifications
// @access  Private
exports.updateNotificationSettings = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const requesterId = req.user.id;
    const { threadId, userId } = req.params;
    const notificationSettings = req.body;
    // Users can only update their own notification settings
    if (requesterId !== userId) {
        return next(new errorResponse_1.default('Access denied', 403));
    }
    // Update notification settings
    const participant = yield threadParticipant_model_1.default.findOneAndUpdate({ threadId, userId, isActive: true }, { notificationSettings }, { new: true });
    if (!participant) {
        return next(new errorResponse_1.default('Participant not found', 404));
    }
    res.status(200).json({
        success: true,
        message: 'Notification settings updated successfully',
        data: participant,
    });
}));
// @desc    Delete thread
// @route   DELETE /api/messages/threads/:id
// @access  Private
exports.deleteThread = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const threadId = req.params.threadId;
    // Check if user is admin of this thread or system admin
    const participant = yield threadParticipant_model_1.default.findOne({
        threadId,
        userId,
        isActive: true,
    });
    const isSystemAdmin = req.user.role === 'admin' ||
        req.user.role === 'superadmin';
    const isThreadAdmin = (participant === null || participant === void 0 ? void 0 : participant.role) === 'admin';
    if (!participant) {
        return next(new errorResponse_1.default('Thread not found or access denied', 404));
    }
    if (!isSystemAdmin && !isThreadAdmin) {
        return next(new errorResponse_1.default('Access denied - admin role required', 403));
    }
    // Mark thread as inactive
    yield messageThread_model_1.default.findByIdAndUpdate(threadId, {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: userId,
    });
    // Mark all participants as inactive
    yield threadParticipant_model_1.default.updateMany({ threadId }, {
        isActive: false,
        leftAt: new Date(),
    });
    res.status(200).json({
        success: true,
        message: 'Thread deleted successfully',
    });
}));
exports.default = {
    getUserThreads: exports.getUserThreads,
    getThread: exports.getThread,
    createThread: exports.createThread,
    sendMessage: exports.sendMessage,
    getThreadParticipants: exports.getThreadParticipants,
    addParticipants: exports.addParticipants,
    leaveThread: exports.leaveThread,
    searchUsers: exports.searchUsers,
    deleteMessage: exports.deleteMessage,
    markMessageAsRead: exports.markMessageAsRead,
    markThreadAsRead: exports.markThreadAsRead,
    updateParticipantRole: exports.updateParticipantRole,
    updateNotificationSettings: exports.updateNotificationSettings,
    deleteThread: exports.deleteThread,
};
