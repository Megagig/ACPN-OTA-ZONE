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
  getPharmacyStats, // Import the stats controller function
} from '../controllers/pharmacy.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Search route
router.route('/search').get(searchPharmacies);

// Stats route - must come before /:id routes to prevent conflict
router.route('/stats').get(
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  cacheMiddleware('pharmacy-stats', { ttl: 3600 }), // Cache for 1 hour
  getPharmacyStats
);

// Dues status route
router.route('/dues-status').get(
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
  cacheMiddleware('pharmacy-dues-status', { ttl: 1800 }), // Cache for 30 minutes
  getPharmaciesDueStatus
);

// Route for the logged-in user's pharmacy
router.route('/me').get(
  cacheMiddleware('pharmacy-user', {
    ttl: 300, // Cache for 5 minutes
    keyFn: (req) => `pharmacy-user:${req.user._id}`, // Use user ID for cache key
  }),
  getMyPharmacy
); // Add this BEFORE the /:id route

// Status update route
router
  .route('/:id/status')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    clearCacheMiddleware('pharmacy'),
    updatePharmacyStatus
  );

// Standard CRUD routes
router
  .route('/')
  .get(
    cacheMiddleware('pharmacies', { ttl: 600 }), // Cache for 10 minutes
    getPharmacies
  )
  .post(clearCacheMiddleware('pharmacy'), createPharmacy);

router
  .route('/:id') // This should come AFTER /me
  .get(
    cacheMiddleware('pharmacy', { ttl: 900 }), // Cache for 15 minutes
    getPharmacy
  )
  .put(clearCacheMiddleware('pharmacy'), updatePharmacy)
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    clearCacheMiddleware('pharmacy'),
    deletePharmacy
  );

// Import due and donation routes so they can be re-used
import dueRoutes from './due.routes';
import donationRoutes from './donation.routes';

// Re-route into other resource routers
router.use('/:pharmacyId/dues', dueRoutes);
router.use('/:pharmacyId/donations', donationRoutes);

export default router;
