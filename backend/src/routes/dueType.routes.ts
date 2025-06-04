import express from 'express';
import {
  protect as authenticateToken,
  authorize as requireRole,
} from '../middleware/auth.middleware';
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
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
router.get(
  '/:id',
  authenticateToken,
  cacheMiddleware('due-types', { ttl: 3600 }), // Cache for 1 hour (due types change infrequently)
  getDueType
);

// Admin routes for due type management
router.post(
  '/',
  authenticateToken,
  requireFinancialRole,
  clearCacheMiddleware('due-types'),
  createDueType
);
router.get(
  '/',
  authenticateToken,
  requireFinancialRole,
  cacheMiddleware('due-types-all', { ttl: 1800 }), // Cache for 30 minutes
  getDueTypes
);
router.put(
  '/:id',
  authenticateToken,
  requireFinancialRole,
  clearCacheMiddleware('due-types'),
  updateDueType
);
router.delete(
  '/:id',
  authenticateToken,
  requireFinancialRole,
  clearCacheMiddleware('due-types'),
  deleteDueType
);

export default router;
