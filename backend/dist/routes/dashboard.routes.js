"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.protect);
// Dashboard overview stats - accessible by admin roles
router.get('/overview', (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), dashboard_controller_1.getOverviewStats);
// User management stats - accessible by admin and superadmin only
router.get('/user-management', (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), dashboard_controller_1.getUserManagementStats);
// System settings routes - accessible by admin and superadmin
router
    .route('/settings')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), dashboard_controller_1.getSystemSettings)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), dashboard_controller_1.updateSystemSettings); // Only superadmin can update settings
// Data export routes - accessible by admin and superadmin
router.get('/export/:type', (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), dashboard_controller_1.exportDashboardData);
exports.default = router;
