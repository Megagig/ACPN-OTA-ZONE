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
// Public routes (still protected but available to all logged-in users)
router.route('/').get(event_controller_1.getAllEvents);
router.route('/:id').get(event_controller_1.getEvent);
router
    .route('/:id/register')
    .post(event_controller_1.registerForEvent)
    .delete(event_controller_1.unregisterFromEvent);
// Admin/Secretary routes
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), event_controller_1.getEventStats);
router
    .route('/')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.createEvent);
router
    .route('/:id')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.updateEvent)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.deleteEvent);
router
    .route('/:id/cancel')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.cancelEvent);
router
    .route('/:id/attendees')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.getEventAttendees);
router
    .route('/:id/attendance/:userId')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), event_controller_1.markAttendance);
// Admin/Treasurer routes
router
    .route('/:id/payment/:userId')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), event_controller_1.updatePaymentStatus);
exports.default = router;
