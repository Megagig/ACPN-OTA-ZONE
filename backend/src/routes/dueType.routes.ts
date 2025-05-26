import express from 'express';
import {
  protect as authenticateToken,
  authorize as requireRole,
} from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import {
  createDueType,
  getDueTypes,
  getDueType,
  updateDueType,
  deleteDueType,
} from '../controllers/dueType.controller';

const router = express.Router();

// Middleware to require admin roles for due type management
const requireFinancialRole = requireRole(
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.FINANCIAL_SECRETARY,
  UserRole.TREASURER
);

// Public routes (authenticated users can view active due types)
router.get('/:id', authenticateToken, getDueType);

// Admin routes for due type management
router.post('/', authenticateToken, requireFinancialRole, createDueType);
router.get('/', authenticateToken, requireFinancialRole, getDueTypes);
router.put('/:id', authenticateToken, requireFinancialRole, updateDueType);
router.delete('/:id', authenticateToken, requireFinancialRole, deleteDueType);

export default router;
