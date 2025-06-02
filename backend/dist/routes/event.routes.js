"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_controller_1 = require("../controllers/event.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_middleware_1.protect);
// Public routes (available to all logged-in users)
router.route('/').get(event_controller_1.getAllEvents);
router.route('/my-events').get(event_controller_1.getMyEvents);
router.route('/my-penalties').get(event_controller_1.getUserPenalties);
router.route('/my-registrations').get(event_controller_1.getUserRegistrations);
// Stats route (must come before /:id to avoid conflict)
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), event_controller_1.getEventStats);
router.route('/:id').get(event_controller_1.getEvent);
// Event registration routes
router.route('/:id/register').post(event_controller_1.registerForEvent);
router.route('/:id/register').delete(event_controller_1.cancelRegistration);
// Get event registrations (Admin/Secretary only)
router
    .route('/:id/registrations')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.getEventRegistrations);
// Event notification routes
router.route('/:id/acknowledge').post(event_controller_1.acknowledgeEvent);
// Admin/Secretary routes - Event management
router
    .route('/')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.createEvent);
router
    .route('/:id')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.updateEvent)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.deleteEvent);
// Admin/Secretary routes - Attendance management
router
    .route('/:id/attendance')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.markAttendance);
// Admin routes - Penalty configuration
router
    .route('/penalty-config/:year')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), event_controller_1.getPenaltyConfig);
router
    .route('/penalty-config')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), event_controller_1.createPenaltyConfig);
router
    .route('/penalty-configs')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), event_controller_1.getAllPenaltyConfigs);
exports.default = router;
