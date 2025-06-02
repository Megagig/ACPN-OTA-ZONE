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
exports.StatusType = exports.PaymentMethodType = exports.CategoryType = exports.RecordType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RecordType;
(function (RecordType) {
    RecordType["INCOME"] = "income";
    RecordType["EXPENSE"] = "expense";
})(RecordType || (exports.RecordType = RecordType = {}));
var CategoryType;
(function (CategoryType) {
    CategoryType["DUES"] = "dues";
    CategoryType["DONATION"] = "donation";
    CategoryType["REGISTRATION"] = "registration";
    CategoryType["EVENT"] = "event";
    CategoryType["OPERATIONAL"] = "operational";
    CategoryType["ADMINISTRATIVE"] = "administrative";
    CategoryType["SALARY"] = "salary";
    CategoryType["UTILITY"] = "utility";
    CategoryType["RENT"] = "rent";
    CategoryType["MISCELLANEOUS"] = "miscellaneous";
    CategoryType["REFUND"] = "refund";
    CategoryType["INVESTMENT"] = "investment";
    CategoryType["OTHER"] = "other";
})(CategoryType || (exports.CategoryType = CategoryType = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CASH"] = "cash";
    PaymentMethodType["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethodType["CHECK"] = "check";
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["MOBILE_MONEY"] = "mobile_money";
    PaymentMethodType["ONLINE_PAYMENT"] = "online_payment";
    PaymentMethodType["OTHER"] = "other";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var StatusType;
(function (StatusType) {
    StatusType["PENDING"] = "pending";
    StatusType["APPROVED"] = "approved";
    StatusType["REJECTED"] = "rejected";
})(StatusType || (exports.StatusType = StatusType = {}));
const financialRecordSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(RecordType),
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
    },
    category: {
        type: String,
        enum: Object.values(CategoryType),
        required: true,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    recordedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    attachmentUrl: {
        type: String,
    },
    attachments: [
        {
            type: String,
        },
    ],
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethodType),
        default: PaymentMethodType.BANK_TRANSFER,
    },
    status: {
        type: String,
        enum: Object.values(StatusType),
        default: StatusType.PENDING,
    },
    pharmacy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pharmacy',
    },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// Index for faster financial reporting queries
financialRecordSchema.index({ type: 1, date: 1 });
financialRecordSchema.index({ category: 1, date: 1 });
const FinancialRecord = mongoose_1.default.model('FinancialRecord', financialRecordSchema);
exports.default = FinancialRecord;
