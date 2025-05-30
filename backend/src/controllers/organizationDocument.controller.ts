import { Request, Response, NextFunction } from 'express';
import OrganizationDocument, {
  DocumentCategory,
  DocumentAccessLevel,
  DocumentStatus,
  IOrganizationDocument,
} from '../models/organizationDocument.model';
import DocumentVersion, {
  IDocumentVersion,
} from '../models/documentVersion.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import { validateUploadedFile } from '../utils/fileUpload';
// import cloudinary from '../config/cloudinary';

// Helper function to check document access permissions
const hasDocumentAccess = (
  userRole: string,
  documentAccessLevel: DocumentAccessLevel
): boolean => {
  console.log(
    `Checking access: userRole=${userRole}, documentAccessLevel=${documentAccessLevel}`
  );

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

  const hasAccess =
    accessHierarchy[documentAccessLevel]?.includes(userRole) || false;
  console.log(
    `Access result: ${hasAccess}, allowed roles for ${documentAccessLevel}:`,
    accessHierarchy[documentAccessLevel]
  );

  return hasAccess;
};

// @desc    Get all organization documents
// @route   GET /api/organization-documents
// @access  Private
export const getOrganizationDocuments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      category,
      accessLevel,
      status,
      tags,
      search,
      uploadedBy,
      dateStart,
      dateEnd,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter: any = {};

    // Access level filtering based on user role
    const userRole = req.user.role;
    const allowedAccessLevels = [];

    if (userRole === 'superadmin' || userRole === 'admin') {
      // Admins can see all documents
    } else if (userRole === 'executives') {
      allowedAccessLevels.push('public', 'members', 'committee', 'executives');
    } else if (userRole === 'committee') {
      allowedAccessLevels.push('public', 'members', 'committee');
    } else {
      allowedAccessLevels.push('public', 'members');
    }

    if (allowedAccessLevels.length > 0) {
      filter.accessLevel = { $in: allowedAccessLevels };
    }

    // Apply additional filters
    if (category) filter.category = category;
    if (
      accessLevel &&
      hasDocumentAccess(userRole, accessLevel as DocumentAccessLevel)
    ) {
      filter.accessLevel = accessLevel;
    }
    if (status) filter.status = status;
    if (uploadedBy) filter.uploadedBy = uploadedBy;

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter['tags.name'] = { $in: tagArray };
    }

    if (dateStart || dateEnd) {
      filter.uploadedAt = {};
      if (dateStart) filter.uploadedAt.$gte = new Date(dateStart as string);
      if (dateEnd) filter.uploadedAt.$lte = new Date(dateEnd as string);
    }

    // Search functionality
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const documents = await OrganizationDocument.find(filter)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await OrganizationDocument.countDocuments(filter);

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
  }
);

// @desc    Get a single organization document
// @route   GET /api/organization-documents/:id
// @access  Private
export const getOrganizationDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await OrganizationDocument.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Check access permissions
    if (!hasDocumentAccess(req.user.role, document.accessLevel)) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access this document`,
          403
        )
      );
    }

    // Increment view count
    document.viewCount += 1;
    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  }
);

// @desc    Upload/Create organization document
// @route   POST /api/organization-documents
// @access  Private/Admin
export const uploadOrganizationDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admins and authorized users can upload documents
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to upload documents`,
          403
        )
      );
    }

    // Validate uploaded file
    const file = validateUploadedFile(req, next, 'file', 10000000);
    if (!file) return; // Validation failed, error already handled

    // TODO: Upload to Cloudinary
    // const result = await cloudinary.uploadToCloudinary(file.tempFilePath, 'organization-documents');

    // Parse tags if provided
    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (error) {
        tags = [];
      }
    }

    // Create document in database
    const document = await OrganizationDocument.create({
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

    const populatedDocument = await OrganizationDocument.findById(
      document._id
    ).populate('uploadedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedDocument,
    });
  }
);

// @desc    Update organization document
// @route   PUT /api/organization-documents/:id
// @access  Private/Admin
export const updateOrganizationDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let document = await OrganizationDocument.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admins can update documents
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update this document`,
          403
        )
      );
    }

    // Parse tags if provided
    if (req.body.tags && typeof req.body.tags === 'string') {
      try {
        req.body.tags = JSON.parse(req.body.tags);
      } catch (error) {
        delete req.body.tags;
      }
    }

    // Update document
    req.body.modifiedAt = new Date();
    req.body.modifiedBy = req.user._id;

    document = await OrganizationDocument.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('uploadedBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: document,
    });
  }
);

// @desc    Delete organization document
// @route   DELETE /api/organization-documents/:id
// @access  Private/Admin
export const deleteOrganizationDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await OrganizationDocument.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admins can delete documents
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete this document`,
          403
        )
      );
    }

    // TODO: Delete from Cloudinary if needed
    // const publicId = extractPublicIdFromUrl(document.fileUrl);
    // await cloudinary.deleteFromCloudinary(publicId);

    // Delete associated versions
    await DocumentVersion.deleteMany({ documentId: req.params.id });

    await document.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Archive organization document
// @route   PUT /api/organization-documents/:id/archive
// @access  Private/Admin
export const archiveOrganizationDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let document = await OrganizationDocument.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admins can archive documents
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to archive this document`,
          403
        )
      );
    }

    document = await OrganizationDocument.findByIdAndUpdate(
      req.params.id,
      {
        status: DocumentStatus.ARCHIVED,
        modifiedAt: new Date(),
        modifiedBy: req.user._id,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('uploadedBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: document,
    });
  }
);

// @desc    Download organization document
// @route   GET /api/organization-documents/:id/download
// @access  Private
export const downloadOrganizationDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await OrganizationDocument.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Check access permissions
    if (!hasDocumentAccess(req.user.role, document.accessLevel)) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to download this document`,
          403
        )
      );
    }

    // Increment download count
    document.downloadCount += 1;
    await document.save();

    // TODO: Implement actual file download from Cloudinary
    // For now, redirect to the file URL
    res.redirect(document.fileUrl);
  }
);

// @desc    Get document versions
// @route   GET /api/organization-documents/:id/versions
// @access  Private
export const getDocumentVersions = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await OrganizationDocument.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Check access permissions
    if (!hasDocumentAccess(req.user.role, document.accessLevel)) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access document versions`,
          403
        )
      );
    }

    const versions = await DocumentVersion.find({ documentId: req.params.id })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ version: -1 });

    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions,
    });
  }
);

// @desc    Upload new document version
// @route   POST /api/organization-documents/:id/versions
// @access  Private/Admin
export const uploadDocumentVersion = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await OrganizationDocument.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admins can upload new versions
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to upload document versions`,
          403
        )
      );
    }

    // Validate uploaded file
    const file = validateUploadedFile(req, next, 'file', 10000000);
    if (!file) return; // Validation failed, error already handled

    // TODO: Upload to Cloudinary
    // const result = await cloudinary.uploadToCloudinary(file.tempFilePath, 'organization-documents');

    // Create version record
    const newVersion = document.version + 1;

    const version = await DocumentVersion.create({
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
    await document.save();

    const populatedVersion = await DocumentVersion.findById(
      version._id
    ).populate('uploadedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedVersion,
    });
  }
);

// @desc    Get document summary/dashboard data
// @route   GET /api/organization-documents/summary
// @access  Private/Admin
export const getDocumentSummary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only admins can view summary
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to view document summary`,
          403
        )
      );
    }

    // Get total count
    const total = await OrganizationDocument.countDocuments({
      status: 'active',
    });

    // Count by category
    const categoryStats = await OrganizationDocument.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Count by access level
    const accessLevelStats = await OrganizationDocument.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$accessLevel', count: { $sum: 1 } } },
    ]);

    // Recent documents
    const recentDocuments = await OrganizationDocument.find({
      status: 'active',
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ uploadedAt: -1 })
      .limit(5);

    // Popular documents
    const popularDocuments = await OrganizationDocument.find({
      status: 'active',
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ downloadCount: -1 })
      .limit(5);

    // Document activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const documentActivity = await OrganizationDocument.aggregate([
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
    const byCategory: any = {};
    Object.values(DocumentCategory).forEach((cat) => {
      byCategory[cat] = 0;
    });
    categoryStats.forEach((stat) => {
      byCategory[stat._id] = stat.count;
    });

    const byAccessLevel: any = {};
    Object.values(DocumentAccessLevel).forEach((level) => {
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
  }
);
