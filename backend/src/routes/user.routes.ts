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
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
import { UserRole } from '../models/user.model';
import { ResourceType, ActionType } from '../models/permission.model';

const router = express.Router();

// Route to get pending approval users
router.route('/pending-approvals').get(
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  checkPermission(ResourceType.USER, ActionType.APPROVE),
  cacheMiddleware('users-pending', { ttl: 60 }), // Cache for 1 minute
  getPendingApprovalUsers
);

// Apply authorization for admin-only routes
router
  .route('/')
  .get(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    checkPermission(ResourceType.USER, ActionType.READ),
    cacheMiddleware('users', { ttl: 300 }), // Cache for 5 minutes
    getUsers
  )
  .post(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.CREATE),
    clearCacheMiddleware('users'), // Clear users cache on create
    createUser
  );

router
  .route('/:id')
  .get(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    checkPermission(ResourceType.USER, ActionType.READ),
    cacheMiddleware('users', { ttl: 600 }), // Cache for 10 minutes
    getUserById
  )
  .put(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.UPDATE),
    clearCacheMiddleware('users'), // Clear cache on update
    updateUser
  )
  .delete(
    protect,
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    checkPermission(ResourceType.USER, ActionType.DELETE),
    clearCacheMiddleware('users'), // Clear cache on delete
    deleteUser
  );

router.route('/:id/approve').put(
  protect,
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
  checkPermission(ResourceType.USER, ActionType.APPROVE),
  clearCacheMiddleware('users'), // Clear cache on approve
  clearCacheMiddleware('users-pending'), // Also clear pending users cache
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
