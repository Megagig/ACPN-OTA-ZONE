import express from 'express';
import {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  initializePermissions,
} from '../controllers/permission.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes that require SuperAdmin access
router
  .route('/')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getPermissions)
  .post(authorize(UserRole.SUPERADMIN), createPermission);

router
  .route('/:id')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getPermissionById)
  .put(authorize(UserRole.SUPERADMIN), updatePermission)
  .delete(authorize(UserRole.SUPERADMIN), deletePermission);

router
  .route('/initialize/default')
  .post(authorize(UserRole.SUPERADMIN), initializePermissions);

export default router;
