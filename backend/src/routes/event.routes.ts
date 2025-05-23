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
router.route('/stats').get(authorize('admin', 'superadmin'), getEventStats);

router
  .route('/')
  .post(authorize('admin', 'superadmin', 'secretary'), createEvent);

router
  .route('/:id')
  .put(authorize('admin', 'superadmin', 'secretary'), updateEvent)
  .delete(authorize('admin', 'superadmin', 'secretary'), deleteEvent);

router
  .route('/:id/cancel')
  .put(authorize('admin', 'superadmin', 'secretary'), cancelEvent);

router
  .route('/:id/attendees')
  .get(authorize('admin', 'superadmin', 'secretary'), getEventAttendees);

router
  .route('/:id/attendance/:userId')
  .put(authorize('admin', 'superadmin', 'secretary'), markAttendance);

// Admin/Treasurer routes
router
  .route('/:id/payment/:userId')
  .put(authorize('admin', 'superadmin', 'treasurer'), updatePaymentStatus);

export default router;
