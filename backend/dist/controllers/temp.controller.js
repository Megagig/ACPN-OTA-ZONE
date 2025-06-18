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
const userNotification_model_1 = __importDefault(require("../models/userNotification.model"));
const createNotificationsForRecipients = (communication, recipients) => __awaiter(void 0, void 0, void 0, function* () {
    if (recipients.length === 0)
        return [];
    // Get sender info
    const senderInfo = communication.senderUserId
        ? `${communication.senderUserId.firstName || ''} ${communication.senderUserId.lastName || ''}`.trim()
        : 'System';
    // Delete any existing notifications to avoid duplicates
    yield userNotification_model_1.default.deleteMany({
        communicationId: communication._id,
    });
    // Create notifications for each recipient
    const notifications = recipients.map((recipient) => ({
        userId: recipient.userId._id, // Correctly access the populated userId._id
        communicationId: communication._id,
        type: communication.messageType === 'announcement'
            ? 'announcement'
            : 'communication',
        title: communication.subject,
        message: communication.content.substring(0, 500), // Truncate if too long
        priority: communication.priority || 'normal',
        isRead: false,
        isDisplayed: false,
        data: {
            senderName: senderInfo,
            messageType: communication.messageType,
            sentDate: communication.sentDate,
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
    }));
    // Create notifications in the database
    const createdNotifications = yield userNotification_model_1.default.insertMany(notifications);
    // Send real-time notifications via socket
    if (global.socketService) {
        recipients.forEach((recipient) => {
            const notification = createdNotifications.find((n) => n.userId.toString() === recipient.userId._id.toString());
            if (notification) {
                global.socketService.emitToUser(recipient.userId._id.toString(), 'new_notification', notification);
            }
        });
    }
    return createdNotifications;
});
exports.default = createNotificationsForRecipients;
