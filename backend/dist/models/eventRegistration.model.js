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
exports.RegistrationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["REGISTERED"] = "registered";
    RegistrationStatus["CONFIRMED"] = "confirmed";
    RegistrationStatus["CANCELLED"] = "cancelled";
    RegistrationStatus["WAITLIST"] = "waitlist";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
const eventRegistrationSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(RegistrationStatus),
        default: RegistrationStatus.REGISTERED,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'waived'],
        default: 'pending',
    },
    paymentReference: {
        type: String,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
// Compound index to ensure one registration per user per event
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Index for efficient pagination and filtering
eventRegistrationSchema.index({ eventId: 1, createdAt: -1 });
eventRegistrationSchema.index({ eventId: 1, status: 1 });
const EventRegistration = mongoose_1.default.model('EventRegistration', eventRegistrationSchema);
exports.default = EventRegistration;
