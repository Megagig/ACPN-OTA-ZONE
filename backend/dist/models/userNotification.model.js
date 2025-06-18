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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserNotificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    communicationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Communication',
        required: false,
    },
    type: {
        type: String,
        enum: ['communication', 'announcement', 'system'],
        required: true,
        default: 'communication',
    },
    title: {
        type: String,
        required: true,
        maxlength: 200,
    },
    message: {
        type: String,
        required: true,
        maxlength: 500,
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
    },
    isDisplayed: {
        type: Boolean,
        default: false,
        index: true,
    },
    displayedAt: {
        type: Date,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true,
    },
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }, // TTL index
    },
}, {
    timestamps: true,
});
// Compound indexes for efficient queries
UserNotificationSchema.index({ userId: 1, isRead: 1 });
UserNotificationSchema.index({ userId: 1, isDisplayed: 1 });
UserNotificationSchema.index({ userId: 1, createdAt: -1 });
UserNotificationSchema.index({ userId: 1, priority: -1, createdAt: -1 });
// Method to mark notification as read
UserNotificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};
// Method to mark notification as displayed
UserNotificationSchema.methods.markAsDisplayed = function () {
    this.isDisplayed = true;
    this.displayedAt = new Date();
    return this.save();
};
// Static method to get unread notifications for a user
UserNotificationSchema.statics.getUnreadForUser = function (userId) {
    return this.find({
        userId,
        isRead: false,
    }).sort({ createdAt: -1 });
};
// Static method to get unread count for a user
UserNotificationSchema.statics.getUnreadCountForUser = function (userId) {
    return this.countDocuments({
        userId,
        isRead: false,
    });
};
// Static method to get unread notifications for a user
UserNotificationSchema.statics.getUnreadForUser = function (userId) {
    return this.find({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        isRead: false,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: new Date() } },
        ],
    })
        .populate('communicationId', 'subject messageType priority senderUserId sentDate')
        .sort({ priority: -1, createdAt: -1 });
};
// Static method to get unread count for a user
UserNotificationSchema.statics.getUnreadCountForUser = function (userId) {
    return this.countDocuments({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        isRead: false,
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: new Date() } },
        ],
    });
};
// Static method to get recent notifications for dashboard
UserNotificationSchema.statics.getRecentForUser = function (userId, limit = 10) {
    return this.find({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: new Date() } },
        ],
    })
        .populate('communicationId', 'subject messageType priority senderUserId sentDate')
        .sort({ createdAt: -1 })
        .limit(limit);
};
const UserNotification = mongoose_1.default.model('UserNotification', UserNotificationSchema);
exports.default = UserNotification;
