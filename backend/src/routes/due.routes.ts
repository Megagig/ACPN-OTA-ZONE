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
  markDueAsPaid,
  getDuesByType,
  getOverdueDues,
  getPharmacyPaymentHistory,
} from '../controllers/due.controller';
import { protect, authorize } from '../middleware/auth.middleware';
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
      getPharmacyDues(req, res, next);
    } else {
      // Check admin authorization for getAllDues
      adminAuthorize(req, res, () => {
        getAllDues(req, res, next);
      });
    }
  })
  .post(adminAuthorize, createDue);

// Bulk operations
router.post('/bulk-assign', adminAuthorize, bulkAssignDues);
router.post('/assign/:pharmacyId', adminAuthorize, assignDueToPharmacy);

// Analytics routes
router.get('/analytics/all', adminAuthorize, getDueAnalytics);
router.get('/analytics/pharmacy/:pharmacyId', getPharmacyDueAnalytics);

// Filtered views
router.get('/type/:typeId', adminAuthorize, getDuesByType);
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

// Legacy payment route (kept for backward compatibility)
router.put('/:id/pay', adminAuthorize, payDue);

export default router;
