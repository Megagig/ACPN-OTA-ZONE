import express from 'express';
import {
  getAllAdminCommunications,
  getUserInbox,
  getUserSentCommunications,
  getCommunication,
  createCommunication,
  markAsRead,
  deleteCommunication,
  getCommunicationStats,
} from '../controllers/communication.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router.route('/inbox').get(getUserInbox);
router.route('/sent').get(getUserSentCommunications);
router.route('/:id/read').put(markAsRead);

// Admin routes
router
  .route('/admin')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getAllAdminCommunications
  );
router
  .route('/stats')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getCommunicationStats
  );

// Mixed routes
router.route('/').post(createCommunication);

router.route('/:id').get(getCommunication).delete(deleteCommunication);

export default router;
