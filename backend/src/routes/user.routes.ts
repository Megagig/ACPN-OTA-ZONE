import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  denyUser,
  changeUserRole,
  getPendingApprovalUsers,
} from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { UserRole } from '../models/user.model';
import { ResourceType, ActionType } from '../models/permission.model';

const router = express.Router();

// Route to get pending approval users
router
  .route('/pending-approvals')
  .get(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.APPROVE),
    getPendingApprovalUsers
  );

// Apply authorization for admin-only routes
router
  .route('/')
  .get(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    checkPermission(ResourceType.USER, ActionType.READ),
    getUsers
  )
  .post(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.CREATE),
    createUser
  );

router
  .route('/:id')
  .get(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    checkPermission(ResourceType.USER, ActionType.READ),
    getUserById
  )
  .put(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.UPDATE),
    updateUser
  )
  .delete(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.DELETE),
    deleteUser
  );

router
  .route('/:id/approve')
  .put(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.APPROVE),
    approveUser
  );

// Route to deny a user
router
  .route('/:id/deny')
  .put(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.REJECT),
    denyUser
  );

router
  .route('/:id/role')
  .put(
    protect,
    authorize(UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.ASSIGN),
    changeUserRole
  );

export default router;
