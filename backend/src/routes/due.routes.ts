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

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(protect);

// Routes with specific access
router
  .route('/')
  .get(authorize('admin', 'superadmin', 'treasurer'), getAllDues);

// Individual due routes
router
  .route('/:id')
  .get(getDue)
  .put(authorize('admin', 'superadmin', 'treasurer'), updateDue)
  .delete(authorize('admin', 'superadmin', 'treasurer'), deleteDue);

// Special routes
router
  .route('/:id/pay')
  .put(authorize('admin', 'superadmin', 'treasurer'), payDue);

export default router;
