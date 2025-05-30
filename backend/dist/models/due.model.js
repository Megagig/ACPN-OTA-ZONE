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
exports.DueAssignmentType = exports.PaymentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["OVERDUE"] = "overdue";
    PaymentStatus["PARTIALLY_PAID"] = "partially_paid";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var DueAssignmentType;
(function (DueAssignmentType) {
    DueAssignmentType["INDIVIDUAL"] = "individual";
    DueAssignmentType["BULK"] = "bulk";
})(DueAssignmentType || (exports.DueAssignmentType = DueAssignmentType = {}));
const penaltySchema = new mongoose_1.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    addedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});
const dueSchema = new mongoose_1.Schema({
    pharmacyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
    },
    dueTypeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'DueType',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Due title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be non-negative'],
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0,
    },
    balance: {
        type: Number,
        default: function () {
            var _a;
            // Safe calculation with null/undefined checks
            if (this === null || this === undefined)
                return 0;
            // Calculate directly without relying on totalAmount
            const amount = Number(this.amount) || 0;
            const penaltyAmount = ((_a = this.penalties) === null || _a === void 0 ? void 0 : _a.reduce((sum, penalty) => sum + Number(penalty.amount || 0), 0)) || 0;
            const amountPaid = Number(this.amountPaid) || 0;
            return amount + penaltyAmount - amountPaid;
        },
    },
    penalties: [penaltySchema],
    totalAmount: {
        type: Number,
        default: function () {
            var _a;
            // Safe calculation with null/undefined checks
            if (this === null || this === undefined)
                return 0;
            const penaltyAmount = ((_a = this.penalties) === null || _a === void 0 ? void 0 : _a.reduce((sum, penalty) => sum + Number(penalty.amount || 0), 0)) || 0;
            // Ensure this.amount is a number with null/undefined check
            const amount = Number(this.amount) || 0;
            return amount + penaltyAmount;
        },
    },
    assignmentType: {
        type: String,
        enum: Object.values(DueAssignmentType),
        required: true,
    },
    assignedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    year: {
        type: Number,
        required: true,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    nextDueDate: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Pre-save middleware to calculate totalAmount and balance
dueSchema.pre('save', function () {
    var _a;
    const currentAmount = Number(this.amount) || 0; // Ensure amount is a number
    const penaltyAmount = ((_a = this.penalties) === null || _a === void 0 ? void 0 : _a.reduce((sum, penalty) => sum + penalty.amount, 0)) || 0;
    this.totalAmount = currentAmount + penaltyAmount;
    const currentAmountPaid = Number(this.amountPaid) || 0; // Ensure amountPaid is a number
    this.balance = this.totalAmount - currentAmountPaid;
    // Update payment status based on payment
    if (this.amountPaid === 0) {
        this.paymentStatus = PaymentStatus.PENDING;
    }
    else if (this.amountPaid >= this.totalAmount) {
        this.paymentStatus = PaymentStatus.PAID;
    }
    else {
        this.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }
});
// Index for faster queries
dueSchema.index({ pharmacyId: 1, dueTypeId: 1, year: 1 }, { unique: true }); // Updated to include dueTypeId in the unique index
dueSchema.index({ pharmacyId: 1, year: 1 }); // Keep this as a non-unique index for queries
dueSchema.index({ dueTypeId: 1 });
dueSchema.index({ paymentStatus: 1 });
dueSchema.index({ dueDate: 1 });
dueSchema.index({ assignedBy: 1 });
const Due = mongoose_1.default.model('Due', dueSchema);
exports.default = Due;
