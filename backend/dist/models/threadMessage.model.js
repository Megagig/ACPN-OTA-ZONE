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
const threadMessageSchema = new mongoose_1.Schema({
    threadId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'MessageThread',
        required: true,
    },
    senderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text',
    },
    attachments: [
        {
            type: String,
        },
    ],
    readBy: [
        {
            userId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'User',
            },
            readAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    editedAt: {
        type: Date,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    deletedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    replyTo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ThreadMessage',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for better performance
threadMessageSchema.index({ threadId: 1, createdAt: -1 });
threadMessageSchema.index({ senderId: 1 });
threadMessageSchema.index({ isDeleted: 1 });
threadMessageSchema.index({ 'readBy.userId': 1 });
// Virtual populate for sender details
threadMessageSchema.virtual('senderDetails', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true,
});
// Virtual populate for reply message details
threadMessageSchema.virtual('replyToMessage', {
    ref: 'ThreadMessage',
    localField: 'replyTo',
    foreignField: '_id',
    justOne: true,
});
const ThreadMessage = mongoose_1.default.model('ThreadMessage', threadMessageSchema);
exports.default = ThreadMessage;
