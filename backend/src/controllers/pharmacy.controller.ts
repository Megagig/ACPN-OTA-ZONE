import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Pharmacy, { RegistrationStatus } from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import cloudinary from '../config/cloudinary';

// Extend Express Request to include files property
declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: any;
      };
    }
  }
}

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Private/Admin
export const getPharmacies = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by registration status if provided
    if (req.query.registrationStatus) {
      query.registrationStatus = req.query.registrationStatus;
    }

    // Filter by location if provided
    if (req.query.location) {
      query.location = { $regex: req.query.location as string, $options: 'i' };
    }

    // Filter by userId if provided
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    const pharmacies = await Pharmacy.find(query)
      .populate('userId', 'firstName lastName email phone')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const total = await Pharmacy.countDocuments(query);

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: pharmacies,
    });
  }
);

// @desc    Get single pharmacy
// @route   GET /api/pharmacies/:id
// @access  Private
export const getPharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacy = await Pharmacy.findById(req.params.id).populate(
      'userId',
      'firstName lastName email phone'
    );

    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'secretary' &&
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access this pharmacy`,
          403
        )
      );
    }

    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  }
);

// @desc    Create new pharmacy
// @route   POST /api/pharmacies
// @access  Private
export const createPharmacy = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Add user ID to request body
    req.body.userId = req.user._id;

    // Check if user already has a pharmacy (for non-admin)
    if (req.user.role === 'member') {
      const existingPharmacy = await Pharmacy.findOne({ userId: req.user._id });

      if (existingPharmacy) {
        res.status(400).json({
          success: false,
          message: 'You already have a registered pharmacy',
        });
      }
    }

    const pharmacy = await Pharmacy.create(req.body);

    res.status(201).json({
      success: true,
      data: pharmacy,
    });
  }
);

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private
export const updatePharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${req.params.id}`, 404)
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
          `User ${req.user._id} is not authorized to update this pharmacy`,
          403
        )
      );
    }

    pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  }
);

// @desc    Delete pharmacy
// @route   DELETE /api/pharmacies/:id
// @access  Private/Admin
export const deletePharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${req.params.id}`, 404)
      );
    }

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete this pharmacy`,
          403
        )
      );
    }

    await pharmacy.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Update pharmacy registration status
// @route   PUT /api/pharmacies/:id/status
// @access  Private/Admin
export const updatePharmacyStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { registrationStatus } = req.body;

    if (
      !registrationStatus ||
      !Object.values(RegistrationStatus).includes(
        registrationStatus as RegistrationStatus
      )
    ) {
      return next(
        new ErrorResponse('Please provide a valid registration status', 400)
      );
    }

    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${req.params.id}`, 404)
      );
    }

    pharmacy.registrationStatus = registrationStatus as RegistrationStatus;
    await pharmacy.save();

    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  }
);

// @desc    Upload pharmacy photos
// @route   PUT /api/pharmacies/:id/photo
// @access  Private
export const pharmacyPhotoUpload = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${req.params.id}`, 404)
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
          `User ${req.user._id} is not authorized to update this pharmacy`,
          403
        )
      );
    }

    if (!req.files) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    // Safely access the file with typechecking
    const fileField = req.files.file;
    if (!fileField) {
      return next(
        new ErrorResponse(`Please provide a file with field name 'file'`, 400)
      );
    }

    // Handle both single file and array of files cases
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check file size
    if (file.size > 1000000) {
      return next(
        new ErrorResponse(`Please upload an image less than 1MB`, 400)
      );
    }

    // TODO: Upload to Cloudinary
    // const result = await cloudinary.uploadToCloudinary(file.tempFilePath, 'pharmacies');
    // pharmacy.photo = result.secure_url;
    // await pharmacy.save();

    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  }
);

// @desc    Get pharmacies with due status
// @route   GET /api/pharmacies/dues-status
// @access  Private/Admin
export const getPharmaciesDueStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const currentYear = new Date().getFullYear();

    const pharmacies = await Pharmacy.aggregate([
      {
        $lookup: {
          from: 'dues',
          localField: '_id',
          foreignField: 'pharmacyId',
          as: 'duesHistory',
        },
      },
      {
        $addFields: {
          currentYearDue: {
            $filter: {
              input: '$duesHistory',
              as: 'due',
              cond: { $eq: ['$$due.year', currentYear] },
            },
          },
        },
      },
      {
        $addFields: {
          dueStatus: {
            $cond: {
              if: { $gt: [{ $size: '$currentYearDue' }, 0] },
              then: 'paid',
              else: 'unpaid',
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          registrationNumber: 1,
          location: 1,
          registrationStatus: 1,
          dueStatus: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
    });
  }
);

// @desc    Search pharmacies
// @route   GET /api/pharmacies/search
// @access  Private
export const searchPharmacies = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Please provide a search query',
      });
    }

    const pharmacies = await Pharmacy.find({
      $text: { $search: query as string },
    }).populate('userId', 'firstName lastName');

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
    });
  }
);
