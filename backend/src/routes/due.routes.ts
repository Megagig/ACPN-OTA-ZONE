import express from 'express';
import {
  getAllDues,
  getDue,
  createDue,
  updateDue,
  deleteDue,
  getPharmacyDues,
  payDue,
} from '../controllers/due.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Routes with specific access
router
  .route('/')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    getAllDues
  );

// Individual due routes
router
  .route('/:id')
  .get(getDue)
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    updateDue
  )
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    deleteDue
  );

// Special routes
router
  .route('/:id/pay')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    payDue
  );

export default router;
