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
exports.PaymentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["OVERDUE"] = "overdue";
    PaymentStatus["PARTIALLY_PAID"] = "partially_paid";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
const dueSchema = new mongoose_1.Schema({
    pharmacyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
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
    paymentDate: {
        type: Date,
    },
    paymentReference: {
        type: String,
    },
    year: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
// Index for faster queries
dueSchema.index({ pharmacyId: 1, year: 1 }, { unique: true });
const Due = mongoose_1.default.model('Due', dueSchema);
exports.default = Due;
