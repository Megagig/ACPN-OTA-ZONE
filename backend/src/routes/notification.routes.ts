import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createNotificationForCommunication,
} from '../controllers/notification.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Member routes
router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/stats', getNotificationStats);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

// Admin routes
router.post(
  '/create-for-communication',
  authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
  createNotificationForCommunication
);

export default router;
