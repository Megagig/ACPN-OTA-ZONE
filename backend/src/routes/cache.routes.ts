import express from 'express';
import {
  protect as authenticateToken,
  authorize as requireRole,
} from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import {
  getCacheStats,
  clearCache,
  warmCache,
} from '../controllers/cache.controller';

const router = express.Router();

// Restrict cache management to super admins and admins only
const requireAdminRole = requireRole(UserRole.SUPERADMIN, UserRole.ADMIN);

// All routes require authentication and admin privileges
router.use(authenticateToken, requireAdminRole);

// Cache management routes
router.get('/stats', getCacheStats);
router.delete('/', clearCache);
router.post('/warm', warmCache);

export default router;
