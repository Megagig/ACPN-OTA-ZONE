import express from 'express';
import { recreateNotificationsForCommunication } from '../controllers/debug.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize(UserRole.ADMIN, UserRole.SUPERADMIN));

// Debug routes
router.post(
  '/recreate-notifications/:communicationId',
  recreateNotificationsForCommunication
);

export default router;
