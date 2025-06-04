import express from 'express';
import {
  getAllDues,
  getDue,
  createDue,
  updateDue,
  deleteDue,
  getPharmacyDues,
  payDue,
  bulkAssignDues,
  assignDueToPharmacy,
  addPenaltyToDue,
  getDueAnalytics,
  getPharmacyDueAnalytics,
  generateClearanceCertificate,
  generatePDFCertificate,
  markDueAsPaid,
  getDuesByType,
  getOverdueDues,
  getPharmacyPaymentHistory,
} from '../controllers/due.controller';
import { fixDuePaymentStatus } from '../controllers/fixPaymentStatus.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Admin roles that can manage dues
const adminAuthorize = authorize(
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.TREASURER,
  UserRole.FINANCIAL_SECRETARY
);

// Routes with specific access
router
  .route('/')
  .get((req, res, next) => {
    // If pharmacyId is present in params (from mergeParams), use getPharmacyDues
    // Otherwise, use getAllDues with admin authorization
    if ((req.params as any).pharmacyId) {
      // Apply cache middleware for pharmacy dues
      cacheMiddleware('dues-pharmacy', { ttl: 120 })(req, res, () => {
        getPharmacyDues(req, res, next);
      });
    } else {
      // Check admin authorization for getAllDues
      adminAuthorize(req, res, () => {
        // Apply cache middleware for all dues
        cacheMiddleware('dues-all', { ttl: 300 })(req, res, () => {
          getAllDues(req, res, next);
        });
      });
    }
  })
  .post(adminAuthorize, clearCacheMiddleware('dues'), createDue);

// Bulk operations
router.post(
  '/bulk-assign',
  adminAuthorize,
  clearCacheMiddleware('dues'),
  bulkAssignDues
);
router.post(
  '/assign/:pharmacyId',
  adminAuthorize,
  clearCacheMiddleware('dues'),
  assignDueToPharmacy
);

// Analytics routes
router.get(
  '/analytics/all',
  adminAuthorize,
  cacheMiddleware('dues-analytics', { ttl: 600 }),
  getDueAnalytics
);
router.get(
  '/analytics/pharmacy/:pharmacyId',
  cacheMiddleware('dues-analytics-pharmacy', { ttl: 300 }),
  getPharmacyDueAnalytics
);

// Filtered views
router.get(
  '/type/:typeId',
  adminAuthorize,
  cacheMiddleware('dues-by-type', { ttl: 300 }),
  getDuesByType
);
router.get('/overdue', adminAuthorize, getOverdueDues);
router.get('/pharmacy/:pharmacyId/history', getPharmacyPaymentHistory);

// Individual due routes
router
  .route('/:id')
  .get(getDue)
  .put(adminAuthorize, updateDue)
  .delete(adminAuthorize, deleteDue);

// Special due operations
router.post('/:id/penalty', adminAuthorize, addPenaltyToDue);
router.put('/:id/mark-paid', adminAuthorize, markDueAsPaid);
router.get('/:id/certificate', generateClearanceCertificate);

// Certificate generation
router.post('/generate-certificate-pdf', generatePDFCertificate);

// Legacy payment route (kept for backward compatibility)
router.put('/:id/pay', adminAuthorize, payDue);

// Fix payment status route
router.post('/fix-payment-status', adminAuthorize, fixDuePaymentStatus);

export default router;
