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

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Routes with specific access
router
  .route('/stats')
  .get(authorize('admin', 'superadmin', 'treasurer'), getDonationStats);

router
  .route('/')
  .get(authorize('admin', 'superadmin', 'treasurer'), getAllDonations);

// Individual donation routes
router
  .route('/:id')
  .get(getDonation)
  .put(authorize('admin', 'superadmin', 'treasurer'), updateDonation)
  .delete(authorize('admin', 'superadmin', 'treasurer'), deleteDonation);

// Special routes
router
  .route('/:id/acknowledge')
  .put(authorize('admin', 'superadmin', 'treasurer'), acknowledgeDonation);

export default router;
