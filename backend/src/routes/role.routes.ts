import express from 'express';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  initializeRoles,
  addPermissionToRole,
  removePermissionFromRole,
  getUsersWithRole,
} from '../controllers/role.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes that require SuperAdmin or Admin access
router
  .route('/')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getRoles)
  .post(authorize(UserRole.SUPERADMIN), createRole);

// Route to initialize default roles (must come before /:id route)
router
  .route('/initialize/default')
  .post(authorize(UserRole.SUPERADMIN), initializeRoles);

router
  .route('/:id')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getRoleById)
  .put(authorize(UserRole.SUPERADMIN), updateRole)
  .delete(authorize(UserRole.SUPERADMIN), deleteRole);

// Routes for managing permissions in a role
router
  .route('/:id/permissions/:permissionId')
  .post(authorize(UserRole.SUPERADMIN), addPermissionToRole)
  .delete(authorize(UserRole.SUPERADMIN), removePermissionFromRole);

// Route to get users with a specific role
router
  .route('/:id/users')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getUsersWithRole);

export default router;
