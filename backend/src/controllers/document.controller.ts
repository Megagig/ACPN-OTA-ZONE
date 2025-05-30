import { Request, Response, NextFunction } from 'express';
import Document, {
  DocumentType,
  VerificationStatus,
  IDocument,
} from '../models/document.model';
import Pharmacy from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import cloudinary from '../config/cloudinary';
import { validateUploadedFile } from '../utils/fileUpload';

// @desc    Get all documents for a pharmacy
// @route   GET /api/pharmacies/:pharmacyId/documents
// @access  Private
export const getPharmacyDocuments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);

    if (!pharmacy) {
      return next(
        new ErrorResponse(
          `Pharmacy not found with id of ${req.params.pharmacyId}`,
          404
        )
      );
    }

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access these documents`,
          403
        )
      );
    }

    const documents = await Document.find({
      pharmacyId: req.params.pharmacyId,
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  }
);

// @desc    Get a single document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await Document.findById(req.params.id).populate({
      path: 'pharmacyId',
      select: 'name userId',
    });

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    const pharmacy = document.pharmacyId as unknown as { userId: any };

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access this document`,
          403
        )
      );
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  }
);

// @desc    Upload document
// @route   POST /api/pharmacies/:pharmacyId/documents
// @access  Private
export const uploadDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.body.pharmacyId = req.params.pharmacyId;

    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);

    if (!pharmacy) {
      return next(
        new ErrorResponse(
          `Pharmacy not found with id of ${req.params.pharmacyId}`,
          404
        )
      );
    }

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to upload documents for this pharmacy`,
          403
        )
      );
    }

    // Validate uploaded file
    const file = validateUploadedFile(req, next);
    if (!file) return; // Validation failed, error already handled

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

      const result = await cloudinary.uploadToCloudinary(
        file.tempFilePath,
        'pharmacy-documents'
      );
      fileUrl = result.secure_url;
      publicId = result.public_id;

      console.log('Pharmacy document uploaded successfully to Cloudinary:', {
        fileUrl,
        publicId,
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Cloudinary upload error for pharmacy document:', {
        message: err?.message,
        stack: err?.stack,
        fileName: file.name,
        fileSize: file.size,
      });
      return next(
        new ErrorResponse(
          `Failed to upload file to storage: ${err?.message || 'Unknown error'}`,
          500
        )
      );
    }

    // Create document in database
    const document = await Document.create({
      pharmacyId: req.params.pharmacyId,
      documentType: req.body.documentType,
      fileName: file.name,
      fileUrl: fileUrl,
      expiryDate: req.body.expiryDate,
      verificationStatus: VerificationStatus.PENDING,
      publicId: publicId, // Store Cloudinary public_id for future deletion
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  }
);

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private/Admin
export const updateDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let document = await Document.findById(req.params.id);

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    // Only allow admins to update document verification status
    if (
      req.body.verificationStatus &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update document verification status`,
          403
        )
      );
    }

    document = await Document.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: document,
    });
  }
);

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await Document.findById(req.params.id).populate({
      path: 'pharmacyId',
      select: 'userId',
    });

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    const pharmacy = document.pharmacyId as unknown as { userId: any };

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete this document`,
          403
        )
      );
    }

    // Delete from Cloudinary if the file is stored there
    if (document.fileUrl.includes('cloudinary.com') && document.publicId) {
      try {
        await cloudinary.deleteFromCloudinary(document.publicId);
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Get documents expiring soon
// @route   GET /api/documents/expiring
// @access  Private/Admin
export const getExpiringDocuments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Find documents expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocuments = await Document.find({
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
  }
);

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
export const downloadDocument = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const document = await Document.findById(req.params.id).populate({
      path: 'pharmacyId',
      select: 'name userId',
    });

    if (!document) {
      return next(
        new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
      );
    }

    const pharmacy = document.pharmacyId as unknown as { userId: any };

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to download this document`,
          403
        )
      );
    }

    // Implement actual file download from Cloudinary
    try {
      console.log('Document fileUrl:', document.fileUrl);
      console.log('Document publicId:', document.publicId);

      if (document.fileUrl.includes('cloudinary.com')) {
        // For Cloudinary URLs, redirect directly to the secure URL
        console.log('Redirecting to Cloudinary URL:', document.fileUrl);
        res.redirect(document.fileUrl);
      } else if (document.fileUrl.startsWith('http')) {
        // For other valid URLs, redirect directly
        console.log('Redirecting to external URL:', document.fileUrl);
        res.redirect(document.fileUrl);
      } else {
        // For placeholder URLs or invalid URLs
        console.log('Invalid or placeholder URL detected:', document.fileUrl);
        return next(
          new ErrorResponse(
            'File not available for download. Please contact admin to re-upload the document.',
            404
          )
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      return next(new ErrorResponse('Failed to download file', 500));
    }
  }
);
