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
exports.DocumentStatus = exports.DocumentAccessLevel = exports.DocumentCategory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var DocumentCategory;
(function (DocumentCategory) {
    DocumentCategory["POLICY"] = "policy";
    DocumentCategory["FORM"] = "form";
    DocumentCategory["REPORT"] = "report";
    DocumentCategory["NEWSLETTER"] = "newsletter";
    DocumentCategory["MINUTES"] = "minutes";
    DocumentCategory["GUIDELINE"] = "guideline";
    DocumentCategory["OTHER"] = "other";
})(DocumentCategory || (exports.DocumentCategory = DocumentCategory = {}));
var DocumentAccessLevel;
(function (DocumentAccessLevel) {
    DocumentAccessLevel["PUBLIC"] = "public";
    DocumentAccessLevel["MEMBERS"] = "members";
    DocumentAccessLevel["COMMITTEE"] = "committee";
    DocumentAccessLevel["EXECUTIVES"] = "executives";
    DocumentAccessLevel["ADMIN"] = "admin";
})(DocumentAccessLevel || (exports.DocumentAccessLevel = DocumentAccessLevel = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["ACTIVE"] = "active";
    DocumentStatus["ARCHIVED"] = "archived";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
const documentTagSchema = new mongoose_1.Schema({
    _id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
});
const organizationDocumentSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
        type: String,
        required: [true, 'Document description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters'],
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
    fileType: {
        type: String,
        required: [true, 'File type is required'],
    },
    category: {
        type: String,
        enum: Object.values(DocumentCategory),
        required: [true, 'Document category is required'],
    },
    tags: [documentTagSchema],
    accessLevel: {
        type: String,
        enum: Object.values(DocumentAccessLevel),
        required: [true, 'Access level is required'],
        default: DocumentAccessLevel.MEMBERS,
    },
    status: {
        type: String,
        enum: Object.values(DocumentStatus),
        default: DocumentStatus.ACTIVE,
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
    modifiedAt: {
        type: Date,
    },
    modifiedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    version: {
        type: Number,
        default: 1,
        min: [1, 'Version must be at least 1'],
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: [0, 'Download count cannot be negative'],
    },
    viewCount: {
        type: Number,
        default: 0,
        min: [0, 'View count cannot be negative'],
    },
    expirationDate: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
organizationDocumentSchema.index({ category: 1 });
organizationDocumentSchema.index({ accessLevel: 1 });
organizationDocumentSchema.index({ status: 1 });
organizationDocumentSchema.index({ uploadedAt: -1 });
organizationDocumentSchema.index({ 'tags.name': 1 });
organizationDocumentSchema.index({ title: 'text', description: 'text' });
// Virtual populate for uploaded by user
organizationDocumentSchema.virtual('uploadedByUser', {
    ref: 'User',
    localField: 'uploadedBy',
    foreignField: '_id',
    justOne: true,
});
// Virtual populate for modified by user
organizationDocumentSchema.virtual('modifiedByUser', {
    ref: 'User',
    localField: 'modifiedBy',
    foreignField: '_id',
    justOne: true,
});
// Ensure virtual fields are serialized
organizationDocumentSchema.set('toJSON', { virtuals: true });
const OrganizationDocument = mongoose_1.default.model('OrganizationDocument', organizationDocumentSchema);
exports.default = OrganizationDocument;
