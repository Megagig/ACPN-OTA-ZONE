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
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes that require SuperAdmin access
router
  .route('/')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    cacheMiddleware('permissions', { ttl: 600 }), // Cache for 10 minutes
    getPermissions
  )
  .post(
    authorize(UserRole.SUPERADMIN),
    clearCacheMiddleware('permissions'),
    createPermission
  );

router
  .route('/:id')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    cacheMiddleware('permissions', { ttl: 600 }),
    getPermissionById
  )
  .put(
    authorize(UserRole.SUPERADMIN),
    clearCacheMiddleware('permissions'),
    updatePermission
  )
  .delete(
    authorize(UserRole.SUPERADMIN),
    clearCacheMiddleware('permissions'),
    deletePermission
  );

router
  .route('/initialize/default')
  .post(
    authorize(UserRole.SUPERADMIN),
    clearCacheMiddleware('permissions'),
    initializePermissions
  );

export default router;
