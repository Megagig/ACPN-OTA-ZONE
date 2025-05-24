import express from 'express';
import {
  getAllFinancialRecords,
  getFinancialRecord,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  getFinancialSummary,
  getFinancialReports,
} from '../controllers/financialRecord.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes and restrict to admin and treasurer
router.use(protect);
router.use(authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER));

// Financial summary and reports
router.route('/summary').get(getFinancialSummary);
router.route('/reports').get(getFinancialReports);

// CRUD operations
router.route('/').get(getAllFinancialRecords).post(createFinancialRecord);

router
  .route('/:id')
  .get(getFinancialRecord)
  .put(updateFinancialRecord)
  .delete(deleteFinancialRecord);

export default router;
