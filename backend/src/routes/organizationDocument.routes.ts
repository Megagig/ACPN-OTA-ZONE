import express from 'express';
import {
  getOrganizationDocuments,
  getOrganizationDocument,
  uploadOrganizationDocument,
  updateOrganizationDocument,
  deleteOrganizationDocument,
  archiveOrganizationDocument,
  downloadOrganizationDocument,
  getDocumentVersions,
  uploadDocumentVersion,
  getDocumentSummary,
} from '../controllers/organizationDocument.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Summary route - must come before /:id routes
router
  .route('/summary')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getDocumentSummary
  );

// Main document routes
router
  .route('/')
  .get(getOrganizationDocuments)
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    uploadOrganizationDocument
  );

// Document-specific routes
router
  .route('/:id')
  .get(getOrganizationDocument)
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    updateOrganizationDocument
  )
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    deleteOrganizationDocument
  );

// Archive route
router
  .route('/:id/archive')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    archiveOrganizationDocument
  );

// Download route
router.route('/:id/download').get(downloadOrganizationDocument);

// Version routes
router
  .route('/:id/versions')
  .get(getDocumentVersions)
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    uploadDocumentVersion
  );

export default router;
