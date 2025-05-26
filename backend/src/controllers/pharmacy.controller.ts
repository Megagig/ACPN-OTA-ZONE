import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Pharmacy, {
  IPharmacy,
  RegistrationStatus,
} from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';
import cloudinary from '../config/cloudinary';

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<format>
    // The public_id includes folders, e.g., acpn-ota/pharmacy_superintendent_photos/generated_id
    const prefix = '/upload/';
    const uploadIndex = url.indexOf(prefix);
    if (uploadIndex === -1) return null;

    // Get the part after "/upload/", which is v<version>/<public_id_with_extension>
    const pathWithVersionAndPublicId = url.substring(
      uploadIndex + prefix.length
    );

    // Find the version part (e.g., v1234567890)
    const versionEndIndex = pathWithVersionAndPublicId.indexOf('/');
    if (versionEndIndex === -1) return null; // Malformed if no slash after version

    // Public ID with extension is after the version and slash
    const publicIdWithExtension = pathWithVersionAndPublicId.substring(
      versionEndIndex + 1
    );

    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    if (lastDotIndex === -1) return publicIdWithExtension; // No extension
    return publicIdWithExtension.substring(0, lastDotIndex);
  } catch (e) {
    console.error('Error parsing public ID from URL:', url, e);
    return null;
  }
};

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

    // Filter by registration status
    if (req.query.registrationStatus) {
      query.registrationStatus = req.query.registrationStatus;
    } else if (req.query.isApproved !== undefined) {
      query.registrationStatus =
        req.query.isApproved === 'true'
          ? RegistrationStatus.ACTIVE
          : RegistrationStatus.PENDING;
    }

    // Filter by townArea if provided
    if (req.query.townArea) {
      query.townArea = { $regex: req.query.townArea as string, $options: 'i' };
    }

    // Filter by userId if provided
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    // Add search functionality
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { registrationNumber: { $regex: searchTerm, $options: 'i' } },
        { townArea: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
      ];
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
      data: {
        pharmacies,
        total,
      },
    });
  }
);

// @desc    Get single pharmacy
// @route   GET /api/pharmacies/:id
// @access  Private
export const getPharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacyId = req.params.id;

    // Add a check for valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
      return next(
        new ErrorResponse(`Invalid pharmacy ID format: ${pharmacyId}`, 400)
      );
    }

    const pharmacy = await Pharmacy.findById(pharmacyId).populate(
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

// @desc    Get the logged-in user's pharmacy
// @route   GET /api/pharmacies/me
// @access  Private
export const getMyPharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacy = await Pharmacy.findOne({ userId: req.user._id }).populate(
      'userId',
      'firstName lastName email phone'
    );

    if (!pharmacy) {
      return next(
        new ErrorResponse('Pharmacy not found for the current user', 404)
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Parse socialMedia if it's a string
    if (req.body.socialMedia && typeof req.body.socialMedia === 'string') {
      try {
        req.body.socialMedia = JSON.parse(req.body.socialMedia);
      } catch (error) {
        return next(new ErrorResponse('Invalid social media data format', 400));
      }
    }

    // Destructure fields from req.body
    const {
      name,
      email,
      phone,
      yearEstablished,
      address,
      landmark,
      townArea,
      pcnLicense,
      licenseExpiryDate,
      numberOfStaff,
      superintendentName,
      superintendentLicenseNumber,
      superintendentPhone,
      directorName,
      directorPhone,
      operatingHours,
      websiteUrl,
      socialMedia,
      servicesOffered,
    } = req.body;

    // Basic validation for required fields (Mongoose will also validate)
    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !landmark ||
      !townArea ||
      !pcnLicense ||
      !licenseExpiryDate ||
      !superintendentName ||
      !superintendentLicenseNumber ||
      !superintendentPhone ||
      !directorName ||
      !directorPhone
    ) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Check if user already has a pharmacy (for non-admin)
    if (req.user.role === 'member') {
      const existingPharmacy = await Pharmacy.findOne({ userId: req.user._id });
      if (existingPharmacy) {
        return next(
          new ErrorResponse('You already have a registered pharmacy', 400)
        );
      }
    }

    let superintendentPhotoUrl = '';
    let directorPhotoUrl = '';
    let superintendentPhotoPublicId: string | null = null;
    let directorPhotoPublicId: string | null = null;

    try {
      // Handle superintendentPhoto upload
      if (req.files && req.files.superintendentPhoto) {
        const superintendentPhotoFile = Array.isArray(
          req.files.superintendentPhoto
        )
          ? req.files.superintendentPhoto[0]
          : req.files.superintendentPhoto;

        if (!superintendentPhotoFile.mimetype.startsWith('image')) {
          return next(
            new ErrorResponse('Superintendent photo must be an image file', 400)
          );
        }
        if (superintendentPhotoFile.size > 1000000) {
          return next(
            new ErrorResponse('Superintendent photo must be less than 1MB', 400)
          );
        }

        const uploadResult = await cloudinary.uploadToCloudinary(
          superintendentPhotoFile.tempFilePath,
          'pharmacy_superintendent_photos'
        );
        superintendentPhotoUrl = uploadResult.secure_url;
        superintendentPhotoPublicId = uploadResult.public_id;
      } else {
        return next(
          new ErrorResponse('Superintendent photo is required.', 400)
        );
      }

      // Handle directorPhoto upload
      if (req.files && req.files.directorPhoto) {
        const directorPhotoFile = Array.isArray(req.files.directorPhoto)
          ? req.files.directorPhoto[0]
          : req.files.directorPhoto;

        if (!directorPhotoFile.mimetype.startsWith('image')) {
          return next(
            new ErrorResponse('Director photo must be an image file', 400)
          );
        }
        if (directorPhotoFile.size > 1000000) {
          return next(
            new ErrorResponse('Director photo must be less than 1MB', 400)
          );
        }

        const uploadResult = await cloudinary.uploadToCloudinary(
          directorPhotoFile.tempFilePath,
          'pharmacy_director_photos'
        );
        directorPhotoUrl = uploadResult.secure_url;
        directorPhotoPublicId = uploadResult.public_id;
      } else {
        return next(new ErrorResponse('Director photo is required.', 400));
      }

      // Create pharmacy object
      const pharmacyData: Partial<IPharmacy> = {
        userId: req.user._id,
        name,
        email,
        phone,
        address,
        landmark,
        townArea,
        pcnLicense,
        licenseExpiryDate: new Date(licenseExpiryDate),
        superintendentName,
        superintendentLicenseNumber,
        superintendentPhoto: superintendentPhotoUrl,
        superintendentPhone,
        directorName,
        directorPhoto: directorPhotoUrl,
        directorPhone,
        ...(yearEstablished && { yearEstablished: Number(yearEstablished) }),
        ...(numberOfStaff && { numberOfStaff: Number(numberOfStaff) }),
        ...(operatingHours && { operatingHours }),
        ...(websiteUrl && { websiteUrl }),
        ...(socialMedia && { socialMedia }),
        ...(servicesOffered &&
          Array.isArray(servicesOffered) && { servicesOffered }),
        registrationStatus: RegistrationStatus.PENDING,
      };

      const newPharmacy = await Pharmacy.create(pharmacyData);

      res.status(201).json({
        success: true,
        data: newPharmacy,
      });
    } catch (error) {
      console.error('Error creating pharmacy:', error);
      // Cleanup uploaded files if pharmacy creation fails
      if (superintendentPhotoPublicId) {
        try {
          await cloudinary.deleteFromCloudinary(superintendentPhotoPublicId);
        } catch (cleanupError) {
          console.error(
            'Failed to cleanup superintendent photo:',
            cleanupError
          );
        }
      }
      if (directorPhotoPublicId) {
        try {
          await cloudinary.deleteFromCloudinary(directorPhotoPublicId);
        } catch (cleanupError) {
          console.error('Failed to cleanup director photo:', cleanupError);
        }
      }
      return next(
        new ErrorResponse('Server error during pharmacy creation', 500)
      );
    }
  }
);

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private
export const updatePharmacy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const pharmacyId = req.params.id;
    let pharmacy = await Pharmacy.findById(pharmacyId);

    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${pharmacyId}`, 404)
      );
    }

    // Parse socialMedia if it's a string
    if (req.body.socialMedia && typeof req.body.socialMedia === 'string') {
      try {
        req.body.socialMedia = JSON.parse(req.body.socialMedia);
      } catch (error) {
        return next(new ErrorResponse('Invalid social media data format', 400));
      }
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

    // Destructure fields from req.body
    const {
      name,
      email,
      phone,
      yearEstablished,
      address,
      landmark,
      townArea,
      pcnLicense,
      licenseExpiryDate,
      numberOfStaff,
      superintendentName,
      superintendentLicenseNumber,
      superintendentPhone,
      directorName,
      directorPhone,
      operatingHours,
      websiteUrl,
      socialMedia,
      servicesOffered,
      registrationStatus, // Admins might update this
    } = req.body;

    // Prepare update data
    const updateData: Partial<IPharmacy> = { ...req.body }; // Start with all fields from body

    // Handle userId separately to prevent accidental override unless by admin
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      if (req.body.userId) updateData.userId = req.body.userId;
    } else {
      delete updateData.userId; // Non-admins cannot change userId
      delete updateData.registrationNumber; // Non-admins cannot change registrationNumber
      if (
        updateData.registrationStatus &&
        updateData.registrationStatus !== pharmacy.registrationStatus
      ) {
        delete updateData.registrationStatus;
      }
    }

    // Convert date strings to Date objects if provided
    if (
      updateData.licenseExpiryDate &&
      typeof updateData.licenseExpiryDate === 'string'
    ) {
      updateData.licenseExpiryDate = new Date(updateData.licenseExpiryDate);
    }
    if (updateData.yearEstablished) {
      updateData.yearEstablished = Number(updateData.yearEstablished);
    }
    if (updateData.numberOfStaff) {
      updateData.numberOfStaff = Number(updateData.numberOfStaff);
    }

    let newSuperintendentPhotoPublicId: string | null = null;
    let newDirectorPhotoPublicId: string | null = null;

    try {
      // Handle superintendentPhoto update
      if (req.files && req.files.superintendentPhoto) {
        const superintendentPhotoFile = Array.isArray(
          req.files.superintendentPhoto
        )
          ? req.files.superintendentPhoto[0]
          : req.files.superintendentPhoto;

        if (!superintendentPhotoFile.mimetype.startsWith('image')) {
          return next(
            new ErrorResponse('Superintendent photo must be an image file', 400)
          );
        }
        if (superintendentPhotoFile.size > 1000000) {
          return next(
            new ErrorResponse('Superintendent photo must be less than 1MB', 400)
          );
        }

        // Optional: Delete old photo from Cloudinary if it exists
        if (pharmacy.superintendentPhoto) {
          const oldPublicId = getPublicIdFromUrl(pharmacy.superintendentPhoto);
          if (oldPublicId) {
            try {
              await cloudinary.deleteFromCloudinary(oldPublicId);
            } catch (deleteError) {
              console.error(
                'Failed to delete old superintendent photo:',
                deleteError
              );
            }
          }
        }

        const uploadResult = await cloudinary.uploadToCloudinary(
          superintendentPhotoFile.tempFilePath,
          'pharmacy_superintendent_photos'
        );
        updateData.superintendentPhoto = uploadResult.secure_url;
        newSuperintendentPhotoPublicId = uploadResult.public_id; // Store public_id for potential cleanup
      }

      // Handle directorPhoto update
      if (req.files && req.files.directorPhoto) {
        const directorPhotoFile = Array.isArray(req.files.directorPhoto)
          ? req.files.directorPhoto[0]
          : req.files.directorPhoto;

        if (!directorPhotoFile.mimetype.startsWith('image')) {
          return next(
            new ErrorResponse('Director photo must be an image file', 400)
          );
        }
        if (directorPhotoFile.size > 1000000) {
          return next(
            new ErrorResponse('Director photo must be less than 1MB', 400)
          );
        }

        // Optional: Delete old photo from Cloudinary if it exists
        if (pharmacy.directorPhoto) {
          const oldPublicId = getPublicIdFromUrl(pharmacy.directorPhoto);
          if (oldPublicId) {
            try {
              await cloudinary.deleteFromCloudinary(oldPublicId);
            } catch (deleteError) {
              console.error(
                'Failed to delete old director photo:',
                deleteError
              );
            }
          }
        }

        const uploadResult = await cloudinary.uploadToCloudinary(
          directorPhotoFile.tempFilePath,
          'pharmacy_director_photos'
        );
        updateData.directorPhoto = uploadResult.secure_url;
        newDirectorPhotoPublicId = uploadResult.public_id; // Store public_id for potential cleanup
      }

      const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
        pharmacyId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        success: true,
        data: updatedPharmacy,
      });
    } catch (error) {
      console.error('Error updating pharmacy:', error);

      // Cleanup newly uploaded files if the pharmacy update failed
      if (newSuperintendentPhotoPublicId) {
        try {
          await cloudinary.deleteFromCloudinary(newSuperintendentPhotoPublicId);
          console.log(
            'Cleaned up new superintendent photo after update error.'
          );
        } catch (cleanupError) {
          console.error(
            'Failed to cleanup new superintendent photo after update error:',
            cleanupError
          );
        }
      }
      if (newDirectorPhotoPublicId) {
        try {
          await cloudinary.deleteFromCloudinary(newDirectorPhotoPublicId);
          console.log('Cleaned up new director photo after update error.');
        } catch (cleanupError) {
          console.error(
            'Failed to cleanup new director photo after update error:',
            cleanupError
          );
        }
      }

      return next(
        new ErrorResponse('Server error during pharmacy update', 500)
      );
    }
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

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete this pharmacy`,
          403
        )
      );
    }
    // Before deleting the pharmacy document, delete associated photos from Cloudinary
    if (pharmacy.superintendentPhoto) {
      const publicId = getPublicIdFromUrl(pharmacy.superintendentPhoto);
      if (publicId) {
        try {
          await cloudinary.deleteFromCloudinary(publicId);
        } catch (e) {
          console.error(
            'Failed to delete superintendent photo during pharmacy deletion:',
            e
          );
          // Decide if you want to block deletion or just log the error
        }
      }
    }
    if (pharmacy.directorPhoto) {
      const publicId = getPublicIdFromUrl(pharmacy.directorPhoto);
      if (publicId) {
        try {
          await cloudinary.deleteFromCloudinary(publicId);
        } catch (e) {
          console.error(
            'Failed to delete director photo during pharmacy deletion:',
            e
          );
        }
      }
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
    // When approving a pharmacy, we'll set it to ACTIVE status
    const registrationStatus = RegistrationStatus.ACTIVE;

    // Validate the pharmacy exists
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return next(
        new ErrorResponse(`Pharmacy not found with id of ${req.params.id}`, 404)
      );
    }

    // Ensure only admin/superadmin can update status
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update pharmacy status`,
          403
        )
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
          // location: 1, // location was removed
          townArea: 1, // use townArea instead
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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Added next for error handling
    const { query } = req.query;

    if (!query) {
      // Use next for consistent error handling
      return next(new ErrorResponse('Please provide a search query', 400));
    }

    try {
      const pharmacies = await Pharmacy.find({
        $text: { $search: query as string },
      }).populate('userId', 'firstName lastName');

      res.status(200).json({
        success: true,
        count: pharmacies.length,
        data: pharmacies,
      });
    } catch (error) {
      console.error('Search pharmacies error:', error);
      return next(new ErrorResponse('Error searching pharmacies', 500));
    }
  }
);

// @desc    Get pharmacy statistics
// @route   GET /api/pharmacies/stats
// @access  Private/Admin
export const getPharmacyStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get total pharmacies count
      const totalPharmacies = await Pharmacy.countDocuments();

      // Get active pharmacies count (approved status)
      const activePharmacies = await Pharmacy.countDocuments({
        registrationStatus: RegistrationStatus.ACTIVE,
      });

      // Get pending approval count
      const pendingApproval = await Pharmacy.countDocuments({
        registrationStatus: RegistrationStatus.PENDING,
      });

      // Get recently added pharmacies (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyAdded = await Pharmacy.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
      });

      // For dues information, we would need to query the Due model
      // For now, setting placeholder values
      const duesCollected = 0;
      const duesOutstanding = 0;

      res.status(200).json({
        success: true,
        data: {
          totalPharmacies,
          activePharmacies,
          pendingApproval,
          recentlyAdded,
          duesCollected,
          duesOutstanding,
        },
      });
    } catch (error) {
      console.error('Get pharmacy stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving pharmacy statistics',
      });
    }
  }
);
