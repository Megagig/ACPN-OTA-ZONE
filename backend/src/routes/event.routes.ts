import express from 'express';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  markAttendance,
  getEventAttendance,
  getMyEvents,
  acknowledgeEvent,
  getEventStats,
  getPenaltyConfig,
  createPenaltyConfig,
  getAllPenaltyConfigs,
  getUserPenalties,
  getUserRegistrations,
  getEventRegistrations,
  calculatePenalties,
  sendAttendanceWarningsForYear,
  publishEvent,
  cancelEvent,
} from '../controllers/event.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (available to all logged-in users)
router.route('/').get(getAllEvents);
router.route('/my-events').get(getMyEvents);
router.route('/my-penalties').get(getUserPenalties);
router.route('/my-registrations').get(getUserRegistrations);

// Stats route (must come before /:id to avoid conflict)
router
  .route('/stats')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getEventStats);

router.route('/:id').get(getEvent);

// Event registration routes
router.route('/:id/register').post(registerForEvent);
router.route('/:id/register').delete(cancelRegistration);

// Get event registrations (Admin/Secretary only)
router
  .route('/:id/registrations')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getEventRegistrations
  );

// Event notification routes
router.route('/:id/acknowledge').post(acknowledgeEvent);

// Admin/Secretary routes - Event management
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

// Admin/Secretary routes - Attendance management
router
  .route('/:id/attendance')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getEventAttendance
  )
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    markAttendance
  );

// Admin routes - Penalty configuration
router
  .route('/penalty-config/:year')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getPenaltyConfig);

router
  .route('/penalty-config')
  .post(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), createPenaltyConfig);

router
  .route('/penalty-configs')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getAllPenaltyConfigs);

// Calculate penalties route
router
  .route('/calculate-penalties/:year')
  .post(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), calculatePenalties);

// Send attendance warnings route
router
  .route('/send-warnings/:year')
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    sendAttendanceWarningsForYear
  );

// Publish and Cancel event routes (Admin/Secretary only)
router
  .route('/:id/publish')
  .patch(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    publishEvent
  );

router
  .route('/:id/cancel')
  .patch(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    cancelEvent
  );

export default router;
