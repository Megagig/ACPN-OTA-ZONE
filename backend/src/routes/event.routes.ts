import express from 'express';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  markAttendance,
  updatePaymentStatus,
  getEventAttendees,
  cancelEvent,
  getEventStats,
} from '../controllers/event.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (still protected but available to all logged-in users)
router.route('/').get(getAllEvents);
router.route('/:id').get(getEvent);
router
  .route('/:id/register')
  .post(registerForEvent)
  .delete(unregisterFromEvent);

// Admin/Secretary routes
router
  .route('/stats')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getEventStats);

router
  .route('/')
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    createEvent
  );

router
  .route('/:id')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    updateEvent
  )
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    deleteEvent
  );

router
  .route('/:id/cancel')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    cancelEvent
  );

router
  .route('/:id/attendees')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getEventAttendees
  );

router
  .route('/:id/attendance/:userId')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    markAttendance
  );

// Admin/Treasurer routes
router
  .route('/:id/payment/:userId')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TREASURER),
    updatePaymentStatus
  );

export default router;
