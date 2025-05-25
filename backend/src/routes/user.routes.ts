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
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Route to get pending approval users
router
  .route('/pending-approvals')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getPendingApprovalUsers);

// Apply authorization for admin-only routes
router
  .route('/')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getUsers
  )
  .post(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), createUser);

router
  .route('/:id')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getUserById
  )
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), updateUser)
  .delete(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), deleteUser);

router
  .route('/:id/approve')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), approveUser);

// Route to deny a user
router
  .route('/:id/deny')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), denyUser);

router.route('/:id/role').put(authorize(UserRole.SUPERADMIN), changeUserRole);

export default router;
