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
exports.recreateNotificationsForCommunication = void 0;
const communication_model_1 = __importDefault(require("../models/communication.model"));
const communicationRecipient_model_1 = __importDefault(require("../models/communicationRecipient.model"));
const userNotification_model_1 = __importDefault(require("../models/userNotification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
// This is a debug endpoint to recreate notifications for a specific communication
exports.recreateNotificationsForCommunication = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { communicationId } = req.params;
    // Find the communication
    const communication = yield communication_model_1.default.findById(communicationId).populate({
        path: 'senderUserId',
        select: 'firstName lastName email',
    });
    if (!communication) {
        res.status(404).json({
            success: false,
            message: `Communication not found with id ${communicationId}`,
        });
        return;
    }
    // Find all recipients for this communication
    const recipients = yield communicationRecipient_model_1.default.find({
        communicationId: communication._id,
    }).populate('userId', 'firstName lastName email role');
    console.log(`Found ${recipients.length} recipients for communication ${communication._id}`);
    // Delete existing notifications for this communication
    const deleteResult = yield userNotification_model_1.default.deleteMany({
        communicationId: communication._id,
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing notifications`);
    if (recipients.length === 0) {
        // If no recipients found, try to create recipients based on the communication type
        let recipientUsers = [];
        if (communication.recipientType === 'all') {
            recipientUsers = yield user_model_1.default.find({ isActive: true }).select('_id firstName lastName email role');
            console.log(`Found ${recipientUsers.length} active users for 'all' recipient type`);
        }
        else if (communication.recipientType === 'admin') {
            recipientUsers = yield user_model_1.default.find({
                isActive: true,
                role: { $in: ['admin', 'superadmin', 'secretary', 'treasurer'] },
            }).select('_id firstName lastName email role');
            console.log(`Found ${recipientUsers.length} admin users for 'admin' recipient type`);
        }
        else {
            console.log(`No matching recipient type: ${communication.recipientType}`);
        }
        if (recipientUsers.length > 0) {
            const recipientRecords = recipientUsers.map((user) => ({
                communicationId: communication._id,
                userId: user._id,
                readStatus: false,
            }));
            const createdRecipients = yield communicationRecipient_model_1.default.insertMany(recipientRecords);
            console.log(`Created ${createdRecipients.length} recipient records`);
            // Refresh recipients list
            const newRecipients = yield communicationRecipient_model_1.default.find({
                communicationId: communication._id,
            }).populate('userId', 'firstName lastName email role');
            recipients.push(...newRecipients);
        }
    }
    if (recipients.length > 0) {
        // Extract sender information
        const senderInfo = communication.senderUserId
            ? `${communication.senderUserId.firstName || ''} ${communication.senderUserId.lastName || ''}`.trim()
            : 'System';
        console.log(`Sender information: ${senderInfo}`);
        // Create notification objects for each recipient
        const notifications = recipients.map((recipient) => {
            const recipientUser = recipient.userId;
            console.log(`Creating notification for recipient: ${recipientUser._id} (${recipientUser.firstName} ${recipientUser.lastName})`);
            return {
                userId: recipient.userId,
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
                // Set expiration for 30 days from now
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };
        });
        const createdNotifications = yield userNotification_model_1.default.insertMany(notifications);
        console.log(`Created ${createdNotifications.length} notifications`);
        res.status(200).json({
            success: true,
            message: `Successfully recreated ${createdNotifications.length} notifications for ${recipients.length} recipients`,
            data: {
                communication: {
                    _id: communication._id,
                    subject: communication.subject,
                    messageType: communication.messageType,
                    status: communication.status,
                    sentDate: communication.sentDate,
                },
                recipientsCount: recipients.length,
                notificationsCount: createdNotifications.length,
            },
        });
    }
    else {
        res.status(404).json({
            success: false,
            message: 'No recipients found for this communication',
        });
    }
}));
