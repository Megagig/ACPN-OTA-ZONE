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

    if (!req.files || !req.files.file) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file as any;

    // Check file size
    if (file.size > 5000000) {
      return next(new ErrorResponse(`File size should be less than 5MB`, 400));
    }

    // TODO: Upload to Cloudinary
    // const result = await cloudinary.uploadToCloudinary(file.tempFilePath, 'documents');

    // Create document in database
    const document = await Document.create({
      pharmacyId: req.params.pharmacyId,
      documentType: req.body.documentType,
      fileName: file.name,
      fileUrl: 'placeholder-url.com', // Replace with result.secure_url when Cloudinary is set up
      expiryDate: req.body.expiryDate,
      verificationStatus: VerificationStatus.PENDING,
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

    // TODO: Delete from Cloudinary if needed
    // const publicId = extractPublicIdFromUrl(document.fileUrl);
    // await cloudinary.deleteFromCloudinary(publicId);

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
