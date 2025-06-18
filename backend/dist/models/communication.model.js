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
exports.CommunicationPriority = exports.CommunicationStatus = exports.RecipientType = exports.MessageType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var MessageType;
(function (MessageType) {
    MessageType["ANNOUNCEMENT"] = "announcement";
    MessageType["NEWSLETTER"] = "newsletter";
    MessageType["DIRECT"] = "direct";
})(MessageType || (exports.MessageType = MessageType = {}));
var RecipientType;
(function (RecipientType) {
    RecipientType["ALL"] = "all";
    RecipientType["ADMIN"] = "admin";
    RecipientType["SPECIFIC"] = "specific";
})(RecipientType || (exports.RecipientType = RecipientType = {}));
var CommunicationStatus;
(function (CommunicationStatus) {
    CommunicationStatus["DRAFT"] = "draft";
    CommunicationStatus["SENT"] = "sent";
    CommunicationStatus["SCHEDULED"] = "scheduled";
})(CommunicationStatus || (exports.CommunicationStatus = CommunicationStatus = {}));
var CommunicationPriority;
(function (CommunicationPriority) {
    CommunicationPriority["LOW"] = "low";
    CommunicationPriority["NORMAL"] = "normal";
    CommunicationPriority["HIGH"] = "high";
    CommunicationPriority["URGENT"] = "urgent";
})(CommunicationPriority || (exports.CommunicationPriority = CommunicationPriority = {}));
const communicationSchema = new mongoose_1.Schema({
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
    },
    senderUserId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientType: {
        type: String,
        enum: Object.values(RecipientType),
        required: true,
    },
    specificRecipients: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    status: {
        type: String,
        enum: Object.values(CommunicationStatus),
        default: CommunicationStatus.DRAFT,
    },
    priority: {
        type: String,
        enum: Object.values(CommunicationPriority),
        default: CommunicationPriority.NORMAL,
    },
    sentDate: {
        type: Date,
    },
    scheduledFor: {
        type: Date,
    },
    messageType: {
        type: String,
        enum: Object.values(MessageType),
        required: true,
    },
    attachmentUrl: {
        type: String,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual populate for recipients
communicationSchema.virtual('recipients', {
    ref: 'CommunicationRecipient',
    localField: '_id',
    foreignField: 'communicationId',
    justOne: false,
});
const Communication = mongoose_1.default.model('Communication', communicationSchema);
exports.default = Communication;
