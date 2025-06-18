"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.protect);
// Member routes
router.get('/', notification_controller_1.getNotifications);
router.get('/unread', notification_controller_1.getUnreadNotifications);
router.get('/stats', notification_controller_1.getNotificationStats);
router.put('/:id/read', notification_controller_1.markAsRead);
router.put('/mark-all-read', notification_controller_1.markAllAsRead);
router.delete('/:id', notification_controller_1.deleteNotification);
// Admin routes
router.post('/create-for-communication', (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), notification_controller_1.createNotificationForCommunication);
exports.default = router;
