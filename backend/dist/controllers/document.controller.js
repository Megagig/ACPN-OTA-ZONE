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
exports.downloadDocument = exports.getExpiringDocuments = exports.deleteDocument = exports.updateDocument = exports.uploadDocument = exports.getDocument = exports.getPharmacyDocuments = void 0;
const document_model_1 = __importStar(require("../models/document.model"));
const pharmacy_model_1 = __importDefault(require("../models/pharmacy.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const fileUpload_1 = require("../utils/fileUpload");
// @desc    Get all documents for a pharmacy
// @route   GET /api/pharmacies/:pharmacyId/documents
// @access  Private
exports.getPharmacyDocuments = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const pharmacy = yield pharmacy_model_1.default.findById(req.params.pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${req.params.pharmacyId}`, 404));
    }
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access these documents`, 403));
    }
    const documents = yield document_model_1.default.find({
        pharmacyId: req.params.pharmacyId,
    });
    res.status(200).json({
        success: true,
        count: documents.length,
        data: documents,
    });
}));
// @desc    Get a single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield document_model_1.default.findById(req.params.id).populate({
        path: 'pharmacyId',
        select: 'name userId',
    });
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    const pharmacy = document.pharmacyId;
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access this document`, 403));
    }
    res.status(200).json({
        success: true,
        data: document,
    });
}));
// @desc    Upload document
// @route   POST /api/pharmacies/:pharmacyId/documents
// @access  Private
exports.uploadDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    req.body.pharmacyId = req.params.pharmacyId;
    const pharmacy = yield pharmacy_model_1.default.findById(req.params.pharmacyId);
    if (!pharmacy) {
        return next(new errorResponse_1.default(`Pharmacy not found with id of ${req.params.pharmacyId}`, 404));
    }
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to upload documents for this pharmacy`, 403));
    }
    // Validate uploaded file
    const file = (0, fileUpload_1.validateUploadedFile)(req, next);
    if (!file)
        return; // Validation failed, error already handled
    // Upload to Cloudinary
    let fileUrl;
    let publicId;
    try {
        console.log('Starting Cloudinary upload for pharmacy document:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype,
            tempFilePath: file.tempFilePath,
        });
        if (!file.tempFilePath) {
            throw new Error('Missing temporary file path for upload');
        }
        const result = yield cloudinary_1.default.uploadToCloudinary(file.tempFilePath, 'pharmacy-documents');
        fileUrl = result.secure_url;
        publicId = result.public_id;
        console.log('Pharmacy document uploaded successfully to Cloudinary:', {
            fileUrl,
            publicId,
        });
    }
    catch (error) {
        const err = error;
        console.error('Cloudinary upload error for pharmacy document:', {
            message: err === null || err === void 0 ? void 0 : err.message,
            stack: err === null || err === void 0 ? void 0 : err.stack,
            fileName: file.name,
            fileSize: file.size,
        });
        return next(new errorResponse_1.default(`Failed to upload file to storage: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`, 500));
    }
    // Create document in database
    const document = yield document_model_1.default.create({
        pharmacyId: req.params.pharmacyId,
        documentType: req.body.documentType,
        fileName: file.name,
        fileUrl: fileUrl,
        expiryDate: req.body.expiryDate,
        verificationStatus: document_model_1.VerificationStatus.PENDING,
        publicId: publicId, // Store Cloudinary public_id for future deletion
    });
    res.status(201).json({
        success: true,
        data: document,
    });
}));
// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private/Admin
exports.updateDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let document = yield document_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Only allow admins to update document verification status
    if (req.body.verificationStatus &&
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update document verification status`, 403));
    }
    document = yield document_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        data: document,
    });
}));
// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield document_model_1.default.findById(req.params.id).populate({
        path: 'pharmacyId',
        select: 'userId',
    });
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    const pharmacy = document.pharmacyId;
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete this document`, 403));
    }
    // Delete from Cloudinary if the file is stored there
    if (document.fileUrl.includes('cloudinary.com') && document.publicId) {
        try {
            yield cloudinary_1.default.deleteFromCloudinary(document.publicId);
        }
        catch (error) {
            console.error('Failed to delete file from Cloudinary:', error);
            // Continue with database deletion even if Cloudinary deletion fails
        }
    }
    yield document.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Get documents expiring soon
// @route   GET /api/documents/expiring
// @access  Private/Admin
exports.getExpiringDocuments = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Find documents expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringDocuments = yield document_model_1.default.find({
        expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
    }).populate({
        path: 'pharmacyId',
        select: 'name',
    });
    res.status(200).json({
        success: true,
        count: expiringDocuments.length,
        data: expiringDocuments,
    });
}));
// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
exports.downloadDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield document_model_1.default.findById(req.params.id).populate({
        path: 'pharmacyId',
        select: 'name userId',
    });
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    const pharmacy = document.pharmacyId;
    // Check if user is admin or the pharmacy owner
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary' &&
        pharmacy.userId.toString() !== req.user._id.toString()) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to download this document`, 403));
    }
    // Implement actual file download from Cloudinary
    try {
        console.log('Document fileUrl:', document.fileUrl);
        console.log('Document publicId:', document.publicId);
        if (document.fileUrl.includes('cloudinary.com')) {
            // For Cloudinary URLs, redirect directly to the secure URL
            console.log('Redirecting to Cloudinary URL:', document.fileUrl);
            res.redirect(document.fileUrl);
        }
        else if (document.fileUrl.startsWith('http')) {
            // For other valid URLs, redirect directly
            console.log('Redirecting to external URL:', document.fileUrl);
            res.redirect(document.fileUrl);
        }
        else {
            // For placeholder URLs or invalid URLs
            console.log('Invalid or placeholder URL detected:', document.fileUrl);
            return next(new errorResponse_1.default('File not available for download. Please contact admin to re-upload the document.', 404));
        }
    }
    catch (error) {
        console.error('Download error:', error);
        return next(new errorResponse_1.default('Failed to download file', 500));
    }
}));
