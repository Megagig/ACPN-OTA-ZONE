import { Request, Response, NextFunction } from 'express';
import Donation, { AcknowledgmentStatus } from '../models/donation.model';
import Pharmacy from '../models/pharmacy.model';
import asyncHandler from '../middleware/async.middleware';
import ErrorResponse from '../utils/errorResponse';

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private/Admin/Treasurer
export const getAllDonations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Implement pagination, filtering and sorting
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by acknowledgment status if provided
    if (req.query.acknowledgmentStatus) {
      query.acknowledgmentStatus = req.query.acknowledgmentStatus;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.donationDate = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    // Filter by purpose if provided
    if (req.query.purpose) {
      query.purpose = { $regex: req.query.purpose, $options: 'i' };
    }

    const donations = await Donation.find(query)
      .populate({
        path: 'pharmacyId',
        select: 'name registrationNumber location',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone',
        },
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ donationDate: -1 });

    // Get total count
    const total = await Donation.countDocuments(query);

    res.status(200).json({
      success: true,
      count: donations.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
      data: donations,
    });
  }
);

// @desc    Get donations for a pharmacy
// @route   GET /api/pharmacies/:pharmacyId/donations
// @access  Private
export const getPharmacyDonations = asyncHandler(
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
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access these donations`,
          403
        )
      );
    }

    const donations = await Donation.find({
      pharmacyId: req.params.pharmacyId,
    }).sort({
      donationDate: -1,
    });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  }
);

// @desc    Get a single donation
// @route   GET /api/donations/:id
// @access  Private
export const getDonation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const donation = await Donation.findById(req.params.id).populate({
      path: 'pharmacyId',
      select: 'name registrationNumber userId',
    });

    if (!donation) {
      return next(
        new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404)
      );
    }

    const pharmacy = donation.pharmacyId as unknown as { userId: any };

    // Check if user is admin or the pharmacy owner
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer' &&
      pharmacy.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to access this donation`,
          403
        )
      );
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  }
);

// @desc    Create a donation
// @route   POST /api/donations
// @access  Private/Admin/Treasurer
export const createDonation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // If the donation is coming from a pharmacy and pharmacyId is provided
    if (req.params.pharmacyId) {
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

      // Check if user is the pharmacy owner or admin/treasurer
      if (
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer' &&
        pharmacy.userId.toString() !== req.user._id.toString()
      ) {
        return next(
          new ErrorResponse(
            `User ${req.user._id} is not authorized to create donations for this pharmacy`,
            403
          )
        );
      }
    } else {
      // For direct donations not associated with a pharmacy
      // Only admins and treasurers can create these
      if (
        req.user.role !== 'admin' &&
        req.user.role !== 'superadmin' &&
        req.user.role !== 'treasurer'
      ) {
        return next(
          new ErrorResponse(
            `User ${req.user._id} is not authorized to create donations`,
            403
          )
        );
      }
    }

    const donation = await Donation.create(req.body);

    res.status(201).json({
      success: true,
      data: donation,
    });
  }
);

// @desc    Update a donation
// @route   PUT /api/donations/:id
// @access  Private/Admin/Treasurer
export const updateDonation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(
        new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin and treasurer can update donations
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to update donations`,
          403
        )
      );
    }

    donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: donation,
    });
  }
);

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
// @access  Private/Admin/Treasurer
export const deleteDonation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(
        new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin and treasurer can delete donations
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to delete donations`,
          403
        )
      );
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Acknowledge a donation
// @route   PUT /api/donations/:id/acknowledge
// @access  Private/Admin/Treasurer
export const acknowledgeDonation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(
        new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404)
      );
    }

    // Only admin and treasurer can acknowledge donations
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user._id} is not authorized to acknowledge donations`,
          403
        )
      );
    }

    donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { acknowledgmentStatus: AcknowledgmentStatus.ACKNOWLEDGED },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: donation,
    });
  }
);

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private/Admin/Treasurer
export const getDonationStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Only admin and treasurer can view donation statistics
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      req.user.role !== 'treasurer'
    ) {
      throw new ErrorResponse(
        `User ${req.user._id} is not authorized to view donation statistics`,
        403
      );
    }

    // Get total donations
    const totalAmount = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get donations by purpose
    const byPurpose = await Donation.aggregate([
      {
        $group: {
          _id: '$purpose',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get monthly donations (for current year)
    const currentYear = new Date().getFullYear();
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          donationDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$donationDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get pending vs acknowledged donations
    const byStatus = await Donation.aggregate([
      {
        $group: {
          _id: '$acknowledgmentStatus',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        byPurpose,
        monthlyDonations,
        byStatus,
      },
    });
  }
);
