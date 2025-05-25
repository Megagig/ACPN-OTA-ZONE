import express from 'express';
import {
  getPharmacies,
  getPharmacy,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  updatePharmacyStatus,
  getPharmaciesDueStatus,
  searchPharmacies,
  getMyPharmacy, // Import the new controller function
} from '../controllers/pharmacy.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Search route
router.route('/search').get(searchPharmacies);

// Dues status route
router
  .route('/dues-status')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    getPharmaciesDueStatus
  );

// Route for the logged-in user's pharmacy
router.route('/me').get(getMyPharmacy); // Add this BEFORE the /:id route

// Status update route
router
  .route('/:id/status')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), updatePharmacyStatus);

// Standard CRUD routes
router.route('/').get(getPharmacies).post(createPharmacy);

router
  .route('/:id') // This should come AFTER /me
  .get(getPharmacy)
  .put(updatePharmacy)
  .delete(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), deletePharmacy);

// Import due and donation routes so they can be re-used
import dueRoutes from './due.routes';
import donationRoutes from './donation.routes';

// Re-route into other resource routers
router.use('/:pharmacyId/dues', dueRoutes);
router.use('/:pharmacyId/donations', donationRoutes);

export default router;
