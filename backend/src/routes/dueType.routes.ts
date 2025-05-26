import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../models/user.model';
import {
  createDueType,
  getAllDueTypes,
  getDueTypeById,
  updateDueType,
  deleteDueType,
  getActiveDueTypes,
} from '../controllers/dueType.controller';

const router = express.Router();

// Middleware to require admin roles for due type management
const requireFinancialRole = requireRole([
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.FINANCIAL_SECRETARY,
  UserRole.TREASURER,
]);

// Public routes (authenticated users can view active due types)
router.get('/active', authenticateToken, getActiveDueTypes);
router.get('/:id', authenticateToken, getDueTypeById);

// Admin routes for due type management
router.post('/', authenticateToken, requireFinancialRole, createDueType);
router.get('/', authenticateToken, requireFinancialRole, getAllDueTypes);
router.put('/:id', authenticateToken, requireFinancialRole, updateDueType);
router.delete('/:id', authenticateToken, requireFinancialRole, deleteDueType);

export default router;
