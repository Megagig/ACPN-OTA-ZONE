import express from 'express';
import {
  getOverviewStats,
  getUserManagementStats,
  getSystemSettings,
  updateSystemSettings,
  exportDashboardData,
} from '../controllers/dashboard.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard overview stats - accessible by admin roles
router.get(
  '/overview',
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
  getOverviewStats
);

// User management stats - accessible by admin and superadmin only
router.get(
  '/user-management',
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  getUserManagementStats
);

// System settings routes - accessible by admin and superadmin
router
  .route('/settings')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getSystemSettings)
  .put(authorize(UserRole.SUPERADMIN), updateSystemSettings); // Only superadmin can update settings

// Data export routes - accessible by admin and superadmin
router.get(
  '/export/:type',
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  exportDashboardData
);

export default router;
