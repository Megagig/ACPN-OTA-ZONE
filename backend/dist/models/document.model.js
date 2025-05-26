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
exports.VerificationStatus = exports.DocumentType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var DocumentType;
(function (DocumentType) {
    DocumentType["LICENSE"] = "license";
    DocumentType["PERMIT"] = "permit";
    DocumentType["CERTIFICATE"] = "certificate";
    DocumentType["IDENTIFICATION"] = "identification";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["REJECTED"] = "rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
const documentSchema = new mongoose_1.Schema({
    pharmacyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
    },
    documentType: {
        type: String,
        enum: Object.values(DocumentType),
        required: [true, 'Document type is required'],
    },
    fileName: {
        type: String,
        required: [true, 'File name is required'],
    },
    fileUrl: {
        type: String,
        required: [true, 'File URL is required'],
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
    },
    verificationStatus: {
        type: String,
        enum: Object.values(VerificationStatus),
        default: VerificationStatus.PENDING,
    },
}, {
    timestamps: true,
});
const Document = mongoose_1.default.model('Document', documentSchema);
exports.default = Document;
