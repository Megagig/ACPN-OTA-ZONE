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
  getUserEventHistory,
  getEventRegistrations,
  calculatePenalties,
  sendAttendanceWarningsForYear,
  publishEvent,
  cancelEvent,
} from '../controllers/event.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
import { UserRole } from '../models/user.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (available to all logged-in users)
router.route('/').get(cacheMiddleware('events', { ttl: 120 }), getAllEvents);
router
  .route('/my-events')
  .get(cacheMiddleware('events-user', { ttl: 60 }), getMyEvents);
router
  .route('/my-penalties')
  .get(cacheMiddleware('penalties-user', { ttl: 300 }), getUserPenalties);
router
  .route('/my-registrations')
  .get(
    cacheMiddleware('registrations-user', { ttl: 60 }),
    getUserRegistrations
  );
router
  .route('/my-history')
  .get(cacheMiddleware('history-user', { ttl: 300 }), getUserEventHistory);

// Stats route (must come before /:id to avoid conflict)
router
  .route('/stats')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN),
    cacheMiddleware('events-stats', { ttl: 300 }),
    getEventStats
  );

router.route('/:id').get(cacheMiddleware('events', { ttl: 180 }), getEvent);

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
    clearCacheMiddleware('events'),
    createEvent
  );

router
  .route('/:id')
  .put(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    clearCacheMiddleware('events'),
    updateEvent
  )
  .delete(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    clearCacheMiddleware('events'),
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
