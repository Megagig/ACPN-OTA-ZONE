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
exports.getDocumentSummary = exports.uploadDocumentVersion = exports.getDocumentVersions = exports.downloadOrganizationDocument = exports.archiveOrganizationDocument = exports.deleteOrganizationDocument = exports.updateOrganizationDocument = exports.uploadOrganizationDocument = exports.getOrganizationDocument = exports.getOrganizationDocuments = void 0;
const organizationDocument_model_1 = __importStar(require("../models/organizationDocument.model"));
const documentVersion_model_1 = __importDefault(require("../models/documentVersion.model"));
const async_middleware_1 = __importDefault(require("../middleware/async.middleware"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const fileUpload_1 = require("../utils/fileUpload");
// import cloudinary from '../config/cloudinary';
// Helper function to check document access permissions
const hasDocumentAccess = (userRole, documentAccessLevel) => {
    var _a;
    console.log(`Checking access: userRole=${userRole}, documentAccessLevel=${documentAccessLevel}`);
    const accessHierarchy = {
        public: [
            'member',
            'secretary',
            'treasurer',
            'financial_secretary',
            'admin',
            'superadmin',
        ],
        members: [
            'member',
            'secretary',
            'treasurer',
            'financial_secretary',
            'admin',
            'superadmin',
        ],
        committee: [
            'secretary',
            'treasurer',
            'financial_secretary',
            'admin',
            'superadmin',
        ],
        executives: ['treasurer', 'financial_secretary', 'admin', 'superadmin'],
        admin: ['admin', 'superadmin'],
    };
    const hasAccess = ((_a = accessHierarchy[documentAccessLevel]) === null || _a === void 0 ? void 0 : _a.includes(userRole)) || false;
    console.log(`Access result: ${hasAccess}, allowed roles for ${documentAccessLevel}:`, accessHierarchy[documentAccessLevel]);
    return hasAccess;
};
// @desc    Get all organization documents
// @route   GET /api/organization-documents
// @access  Private
exports.getOrganizationDocuments = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, accessLevel, status, tags, search, uploadedBy, dateStart, dateEnd, page = 1, limit = 10, } = req.query;
    // Build filter object
    const filter = {};
    // Access level filtering based on user role
    const userRole = req.user.role;
    const allowedAccessLevels = [];
    if (userRole === 'superadmin' || userRole === 'admin') {
        // Admins can see all documents
    }
    else if (userRole === 'executives') {
        allowedAccessLevels.push('public', 'members', 'committee', 'executives');
    }
    else if (userRole === 'committee') {
        allowedAccessLevels.push('public', 'members', 'committee');
    }
    else {
        allowedAccessLevels.push('public', 'members');
    }
    if (allowedAccessLevels.length > 0) {
        filter.accessLevel = { $in: allowedAccessLevels };
    }
    // Apply additional filters
    if (category)
        filter.category = category;
    if (accessLevel &&
        hasDocumentAccess(userRole, accessLevel)) {
        filter.accessLevel = accessLevel;
    }
    if (status)
        filter.status = status;
    if (uploadedBy)
        filter.uploadedBy = uploadedBy;
    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter['tags.name'] = { $in: tagArray };
    }
    if (dateStart || dateEnd) {
        filter.uploadedAt = {};
        if (dateStart)
            filter.uploadedAt.$gte = new Date(dateStart);
        if (dateEnd)
            filter.uploadedAt.$lte = new Date(dateEnd);
    }
    // Search functionality
    if (search) {
        filter.$text = { $search: search };
    }
    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    // Execute query
    const documents = yield organizationDocument_model_1.default.find(filter)
        .populate('uploadedBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email')
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limitNum);
    const total = yield organizationDocument_model_1.default.countDocuments(filter);
    res.status(200).json({
        success: true,
        count: documents.length,
        total,
        pagination: {
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
        },
        data: documents,
    });
}));
// @desc    Get a single organization document
// @route   GET /api/organization-documents/:id
// @access  Private
exports.getOrganizationDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield organizationDocument_model_1.default.findById(req.params.id)
        .populate('uploadedBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email');
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Check access permissions
    if (!hasDocumentAccess(req.user.role, document.accessLevel)) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access this document`, 403));
    }
    // Increment view count
    document.viewCount += 1;
    yield document.save();
    res.status(200).json({
        success: true,
        data: document,
    });
}));
// @desc    Upload/Create organization document
// @route   POST /api/organization-documents
// @access  Private/Admin
exports.uploadOrganizationDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admins and authorized users can upload documents
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to upload documents`, 403));
    }
    // Validate uploaded file
    const file = (0, fileUpload_1.validateUploadedFile)(req, next, 'file', 10000000);
    if (!file)
        return; // Validation failed, error already handled
    // TODO: Upload to Cloudinary
    // const result = await cloudinary.uploadToCloudinary(file.tempFilePath, 'organization-documents');
    // Parse tags if provided
    let tags = [];
    if (req.body.tags) {
        try {
            tags = JSON.parse(req.body.tags);
        }
        catch (error) {
            tags = [];
        }
    }
    // Create document in database
    const document = yield organizationDocument_model_1.default.create({
        title: req.body.title,
        description: req.body.description,
        fileUrl: 'placeholder-url.com', // Replace with result.secure_url when Cloudinary is set up
        fileName: file.name,
        fileSize: file.size,
        fileType: file.mimetype,
        category: req.body.category,
        tags,
        accessLevel: req.body.accessLevel,
        uploadedBy: req.user._id,
        expirationDate: req.body.expirationDate || undefined,
    });
    const populatedDocument = yield organizationDocument_model_1.default.findById(document._id).populate('uploadedBy', 'firstName lastName email');
    res.status(201).json({
        success: true,
        data: populatedDocument,
    });
}));
// @desc    Update organization document
// @route   PUT /api/organization-documents/:id
// @access  Private/Admin
exports.updateOrganizationDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let document = yield organizationDocument_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Only admins can update documents
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to update this document`, 403));
    }
    // Parse tags if provided
    if (req.body.tags && typeof req.body.tags === 'string') {
        try {
            req.body.tags = JSON.parse(req.body.tags);
        }
        catch (error) {
            delete req.body.tags;
        }
    }
    // Update document
    req.body.modifiedAt = new Date();
    req.body.modifiedBy = req.user._id;
    document = yield organizationDocument_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })
        .populate('uploadedBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: document,
    });
}));
// @desc    Delete organization document
// @route   DELETE /api/organization-documents/:id
// @access  Private/Admin
exports.deleteOrganizationDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield organizationDocument_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Only admins can delete documents
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to delete this document`, 403));
    }
    // TODO: Delete from Cloudinary if needed
    // const publicId = extractPublicIdFromUrl(document.fileUrl);
    // await cloudinary.deleteFromCloudinary(publicId);
    // Delete associated versions
    yield documentVersion_model_1.default.deleteMany({ documentId: req.params.id });
    yield document.deleteOne();
    res.status(200).json({
        success: true,
        data: {},
    });
}));
// @desc    Archive organization document
// @route   PUT /api/organization-documents/:id/archive
// @access  Private/Admin
exports.archiveOrganizationDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let document = yield organizationDocument_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Only admins can archive documents
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to archive this document`, 403));
    }
    document = yield organizationDocument_model_1.default.findByIdAndUpdate(req.params.id, {
        status: organizationDocument_model_1.DocumentStatus.ARCHIVED,
        modifiedAt: new Date(),
        modifiedBy: req.user._id,
    }, {
        new: true,
        runValidators: true,
    })
        .populate('uploadedBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email');
    res.status(200).json({
        success: true,
        data: document,
    });
}));
// @desc    Download organization document
// @route   GET /api/organization-documents/:id/download
// @access  Private
exports.downloadOrganizationDocument = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield organizationDocument_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Check access permissions
    if (!hasDocumentAccess(req.user.role, document.accessLevel)) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to download this document`, 403));
    }
    // Increment download count
    document.downloadCount += 1;
    yield document.save();
    // TODO: Implement actual file download from Cloudinary
    // For now, redirect to the file URL
    res.redirect(document.fileUrl);
}));
// @desc    Get document versions
// @route   GET /api/organization-documents/:id/versions
// @access  Private
exports.getDocumentVersions = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield organizationDocument_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Check access permissions
    if (!hasDocumentAccess(req.user.role, document.accessLevel)) {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to access document versions`, 403));
    }
    const versions = yield documentVersion_model_1.default.find({ documentId: req.params.id })
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ version: -1 });
    res.status(200).json({
        success: true,
        count: versions.length,
        data: versions,
    });
}));
// @desc    Upload new document version
// @route   POST /api/organization-documents/:id/versions
// @access  Private/Admin
exports.uploadDocumentVersion = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const document = yield organizationDocument_model_1.default.findById(req.params.id);
    if (!document) {
        return next(new errorResponse_1.default(`Document not found with id of ${req.params.id}`, 404));
    }
    // Only admins can upload new versions
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to upload document versions`, 403));
    }
    // Validate uploaded file
    const file = (0, fileUpload_1.validateUploadedFile)(req, next, 'file', 10000000);
    if (!file)
        return; // Validation failed, error already handled
    // TODO: Upload to Cloudinary
    // const result = await cloudinary.uploadToCloudinary(file.tempFilePath, 'organization-documents');
    // Create version record
    const newVersion = document.version + 1;
    const version = yield documentVersion_model_1.default.create({
        documentId: req.params.id,
        fileUrl: 'placeholder-url.com', // Replace with result.secure_url
        fileName: file.name,
        fileSize: file.size,
        version: newVersion,
        uploadedBy: req.user._id,
        changes: req.body.changes || 'New version uploaded',
    });
    // Update main document
    document.version = newVersion;
    document.fileUrl = version.fileUrl;
    document.fileName = version.fileName;
    document.fileSize = version.fileSize;
    document.modifiedAt = new Date();
    document.modifiedBy = req.user._id;
    yield document.save();
    const populatedVersion = yield documentVersion_model_1.default.findById(version._id).populate('uploadedBy', 'firstName lastName email');
    res.status(201).json({
        success: true,
        data: populatedVersion,
    });
}));
// @desc    Get document summary/dashboard data
// @route   GET /api/organization-documents/summary
// @access  Private/Admin
exports.getDocumentSummary = (0, async_middleware_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Only admins can view summary
    if (req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'secretary') {
        return next(new errorResponse_1.default(`User ${req.user._id} is not authorized to view document summary`, 403));
    }
    // Get total count
    const total = yield organizationDocument_model_1.default.countDocuments({
        status: 'active',
    });
    // Count by category
    const categoryStats = yield organizationDocument_model_1.default.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    // Count by access level
    const accessLevelStats = yield organizationDocument_model_1.default.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$accessLevel', count: { $sum: 1 } } },
    ]);
    // Recent documents
    const recentDocuments = yield organizationDocument_model_1.default.find({
        status: 'active',
    })
        .populate('uploadedBy', 'firstName lastName')
        .sort({ uploadedAt: -1 })
        .limit(5);
    // Popular documents
    const popularDocuments = yield organizationDocument_model_1.default.find({
        status: 'active',
    })
        .populate('uploadedBy', 'firstName lastName')
        .sort({ downloadCount: -1 })
        .limit(5);
    // Document activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const documentActivity = yield organizationDocument_model_1.default.aggregate([
        {
            $match: {
                uploadedAt: { $gte: thirtyDaysAgo },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$uploadedAt' },
                },
                views: { $sum: '$viewCount' },
                downloads: { $sum: '$downloadCount' },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    // Format the data
    const byCategory = {};
    Object.values(organizationDocument_model_1.DocumentCategory).forEach((cat) => {
        byCategory[cat] = 0;
    });
    categoryStats.forEach((stat) => {
        byCategory[stat._id] = stat.count;
    });
    const byAccessLevel = {};
    Object.values(organizationDocument_model_1.DocumentAccessLevel).forEach((level) => {
        byAccessLevel[level] = 0;
    });
    accessLevelStats.forEach((stat) => {
        byAccessLevel[stat._id] = stat.count;
    });
    const summary = {
        total,
        byCategory,
        byAccessLevel,
        recentDocuments,
        popularDocuments,
        documentActivity: documentActivity.map((activity) => ({
            date: activity._id,
            views: activity.views,
            downloads: activity.downloads,
        })),
    };
    res.status(200).json({
        success: true,
        data: summary,
    });
}));
