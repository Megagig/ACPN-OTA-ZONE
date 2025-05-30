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
const documentVersionSchema = new mongoose_1.Schema({
    documentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'OrganizationDocument',
        required: true,
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
    },
    fileName: {
        type: String,
        required: [true, 'File name is required'],
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required'],
        min: [0, 'File size cannot be negative'],
    },
    version: {
        type: Number,
        required: [true, 'Version number is required'],
        min: [1, 'Version must be at least 1'],
    },
    uploadedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    changes: {
        type: String,
        required: [true, 'Version changes description is required'],
        trim: true,
        maxlength: [
            500,
            'Changes description cannot be more than 500 characters',
        ],
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
documentVersionSchema.index({ documentId: 1, version: -1 });
documentVersionSchema.index({ uploadedAt: -1 });
// Virtual populate for uploaded by user
documentVersionSchema.virtual('uploadedByUser', {
    ref: 'User',
    localField: 'uploadedBy',
    foreignField: '_id',
    justOne: true,
});
// Ensure virtual fields are serialized
documentVersionSchema.set('toJSON', { virtuals: true });
const DocumentVersion = mongoose_1.default.model('DocumentVersion', documentVersionSchema);
exports.default = DocumentVersion;
