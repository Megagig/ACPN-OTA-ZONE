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
exports.ActionType = exports.ResourceType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ResourceType;
(function (ResourceType) {
    ResourceType["USER"] = "user";
    ResourceType["PHARMACY"] = "pharmacy";
    ResourceType["FINANCIAL_RECORD"] = "financial_record";
    ResourceType["EVENT"] = "event";
    ResourceType["DOCUMENT"] = "document";
    ResourceType["COMMUNICATION"] = "communication";
    ResourceType["ELECTION"] = "election";
    ResourceType["POLL"] = "poll";
    ResourceType["DONATION"] = "donation";
    ResourceType["DUE"] = "due";
    ResourceType["ROLE"] = "role";
    ResourceType["PERMISSION"] = "permission";
    ResourceType["AUDIT_TRAIL"] = "audit_trail";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ActionType;
(function (ActionType) {
    ActionType["CREATE"] = "create";
    ActionType["READ"] = "read";
    ActionType["UPDATE"] = "update";
    ActionType["DELETE"] = "delete";
    ActionType["APPROVE"] = "approve";
    ActionType["REJECT"] = "reject";
    ActionType["ASSIGN"] = "assign";
    ActionType["MANAGE"] = "manage";
    ActionType["EXPORT"] = "export";
    ActionType["IMPORT"] = "import";
})(ActionType || (exports.ActionType = ActionType = {}));
const permissionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Permission name is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Permission description is required'],
        trim: true,
    },
    resource: {
        type: String,
        enum: Object.values(ResourceType),
        required: [true, 'Resource type is required'],
    },
    action: {
        type: String,
        enum: Object.values(ActionType),
        required: [true, 'Action type is required'],
    },
}, {
    timestamps: true,
});
// Create a compound index to ensure uniqueness of resource-action combinations
permissionSchema.index({ resource: 1, action: 1 }, { unique: true });
const Permission = mongoose_1.default.model('Permission', permissionSchema);
exports.default = Permission;
