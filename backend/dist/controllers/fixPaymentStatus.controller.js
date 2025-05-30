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
exports.fixDuePaymentStatus = void 0;
const due_model_1 = __importStar(require("../models/due.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
// @desc    Fix dues with incorrect payment status
// @route   POST /api/dues/fix-payment-status
// @access  Private/Admin
exports.fixDuePaymentStatus = (0, async_middleware_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Find all dues with positive amount paid but not marked as fully paid
    const dues = yield due_model_1.default.find({
        $expr: {
            $and: [
                { $gt: ['$amountPaid', 0] }, // amountPaid > 0
                { $lte: ['$balance', 0] }, // balance <= 0
                { $ne: ['$paymentStatus', due_model_1.PaymentStatus.PAID] }, // paymentStatus is not 'paid'
            ],
        },
    });
    console.log(`Found ${dues.length} dues with incorrect payment status`);
    // Update each due with correct payment status
    let updatedCount = 0;
    for (const due of dues) {
        // Double check balance calculation
        const balance = due.totalAmount - due.amountPaid;
        if (balance <= 0 && due.paymentStatus !== due_model_1.PaymentStatus.PAID) {
            due.paymentStatus = due_model_1.PaymentStatus.PAID;
            due.balance = 0; // Ensure balance is exactly 0
            yield due.save();
            updatedCount++;
        }
    }
    res.status(200).json({
        success: true,
        message: `Fixed payment status for ${updatedCount} dues`,
        data: {
            examined: dues.length,
            updated: updatedCount,
        },
    });
}));
