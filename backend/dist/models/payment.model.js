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
exports.PaymentType = exports.PaymentApprovalStatus = exports.PaymentMethod = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CHECK"] = "check";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentApprovalStatus;
(function (PaymentApprovalStatus) {
    PaymentApprovalStatus["PENDING"] = "pending";
    PaymentApprovalStatus["APPROVED"] = "approved";
    PaymentApprovalStatus["REJECTED"] = "rejected";
    PaymentApprovalStatus["DENIED"] = "denied";
})(PaymentApprovalStatus || (exports.PaymentApprovalStatus = PaymentApprovalStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["DUE"] = "due";
    PaymentType["DONATION"] = "donation";
    PaymentType["EVENT_FEE"] = "event_fee";
    PaymentType["REGISTRATION_FEE"] = "registration_fee";
    PaymentType["CONFERENCE_FEE"] = "conference_fee";
    PaymentType["ACCOMMODATION"] = "accommodation";
    PaymentType["SEMINAR"] = "seminar";
    PaymentType["TRANSPORTATION"] = "transportation";
    PaymentType["BUILDING"] = "building";
    PaymentType["OTHER"] = "other";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
const paymentSchema = new mongoose_1.Schema({
    paymentType: {
        type: String,
        enum: Object.values(PaymentType),
        required: true,
        default: PaymentType.DUE,
    },
    dueId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Due',
        required: function () {
            return this.paymentType === PaymentType.DUE;
        },
    },
    pharmacyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: [0.01, 'Payment amount must be greater than 0'],
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: [true, 'Payment method is required'],
    },
    paymentReference: {
        type: String,
        trim: true,
    },
    receiptUrl: {
        type: String,
        required: [true, 'Receipt upload is required'],
    },
    receiptPublicId: {
        type: String,
        required: true,
    },
    approvalStatus: {
        type: String,
        enum: Object.values(PaymentApprovalStatus),
        default: PaymentApprovalStatus.PENDING,
    },
    approvedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
    rejectionReason: {
        type: String,
        trim: true,
    },
    submittedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    meta: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// Indexes for faster queries
paymentSchema.index({ dueId: 1 });
paymentSchema.index({ pharmacyId: 1 });
paymentSchema.index({ approvalStatus: 1 });
paymentSchema.index({ submittedAt: -1 });
const Payment = mongoose_1.default.model('Payment', paymentSchema);
exports.default = Payment;
