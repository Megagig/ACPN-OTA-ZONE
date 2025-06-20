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
const messageThreadSchema = new mongoose_1.Schema({
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
    },
    participants: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastMessage: {
        type: String,
        maxlength: 1000,
    },
    lastMessageAt: {
        type: Date,
    },
    lastMessageBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    threadType: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for better performance
messageThreadSchema.index({ participants: 1 });
messageThreadSchema.index({ createdBy: 1 });
messageThreadSchema.index({ lastMessageAt: -1 });
messageThreadSchema.index({ isActive: 1 });
// Virtual populate for messages
messageThreadSchema.virtual('messages', {
    ref: 'ThreadMessage',
    localField: '_id',
    foreignField: 'threadId',
    justOne: false,
});
// Virtual populate for participant details
messageThreadSchema.virtual('participantDetails', {
    ref: 'User',
    localField: 'participants',
    foreignField: '_id',
    justOne: false,
});
const MessageThread = mongoose_1.default.model('MessageThread', messageThreadSchema);
exports.default = MessageThread;
