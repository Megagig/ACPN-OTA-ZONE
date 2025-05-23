import express from 'express';
import {
  getPharmacyDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getExpiringDocuments,
} from '../controllers/document.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router({ mergeParams: true });

// Apply protection to all routes
router.use(protect);

// Routes that apply to /api/documents
router
  .route('/expiring')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getExpiringDocuments
  );

router
  .route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

// Routes that apply to /api/pharmacies/:pharmacyId/documents
router.route('/').get(getPharmacyDocuments).post(uploadDocument);

export default router;
