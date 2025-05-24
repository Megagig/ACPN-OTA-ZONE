import express from 'express';
import {
  getAllDonations,
  getDonation,
  createDonation,
  updateDonation,
  deleteDonation,
  getPharmacyDonations,
  acknowledgeDonation,
  getDonationStats,
} from '../controllers/donation.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Routes with specific access
router
  .route('/stats')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    getDonationStats
  );

router
  .route('/')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    getAllDonations
  );

// Individual donation routes
router
  .route('/:id')
  .get(getDonation)
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    updateDonation
  )
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    deleteDonation
  );

// Special routes
router
  .route('/:id/acknowledge')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    acknowledgeDonation
  );

export default router;
