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
exports.ActionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ActionType;
(function (ActionType) {
    ActionType["CREATE"] = "create";
    ActionType["READ"] = "read";
    ActionType["UPDATE"] = "update";
    ActionType["DELETE"] = "delete";
    ActionType["LOGIN"] = "login";
    ActionType["LOGOUT"] = "logout";
    ActionType["PAYMENT"] = "payment";
    ActionType["APPROVAL"] = "approval";
    ActionType["REJECTION"] = "rejection";
    ActionType["ACTIVATION"] = "activation";
    ActionType["DEACTIVATION"] = "deactivation";
    ActionType["SUSPENSION"] = "suspension";
    ActionType["ROLE_ASSIGNMENT"] = "role_assignment";
    ActionType["PERMISSION_ASSIGNMENT"] = "permission_assignment";
    ActionType["BULK_ACTION"] = "bulk_action";
    ActionType["OTHER"] = "other";
})(ActionType || (exports.ActionType = ActionType = {}));
const auditTrailSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        enum: Object.values(ActionType),
        required: true,
    },
    resourceType: {
        type: String,
        required: true,
    },
    resourceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    ipAddress: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
// Index for faster queries
auditTrailSchema.index({ userId: 1, timestamp: -1 });
auditTrailSchema.index({ resourceType: 1, resourceId: 1 });
const AuditTrail = mongoose_1.default.model('AuditTrail', auditTrailSchema);
exports.default = AuditTrail;
