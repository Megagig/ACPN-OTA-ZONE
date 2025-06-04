"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const cache_middleware_1 = require("../middleware/cache.middleware");
const user_model_1 = require("../models/user.model");
const permission_model_1 = require("../models/permission.model");
const router = express_1.default.Router();
// Route to get pending approval users
router.route('/pending-approvals').get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.APPROVE), (0, cache_middleware_1.cacheMiddleware)('users-pending', { ttl: 60 }), // Cache for 1 minute
user_controller_1.getPendingApprovalUsers);
// Apply authorization for admin-only routes
router
    .route('/')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.READ), (0, cache_middleware_1.cacheMiddleware)('users', { ttl: 300 }), // Cache for 5 minutes
user_controller_1.getUsers)
    .post(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.CREATE), (0, cache_middleware_1.clearCacheMiddleware)('users'), // Clear users cache on create
user_controller_1.createUser);
router
    .route('/:id')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.READ), (0, cache_middleware_1.cacheMiddleware)('users', { ttl: 600 }), // Cache for 10 minutes
user_controller_1.getUserById)
    .put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.UPDATE), (0, cache_middleware_1.clearCacheMiddleware)('users'), // Clear cache on update
user_controller_1.updateUser)
    .delete(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.DELETE), (0, cache_middleware_1.clearCacheMiddleware)('users'), // Clear cache on delete
user_controller_1.deleteUser);
router.route('/:id/approve').put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.APPROVE), (0, cache_middleware_1.clearCacheMiddleware)('users'), // Clear cache on approve
(0, cache_middleware_1.clearCacheMiddleware)('users-pending'), // Also clear pending users cache
user_controller_1.approveUser);
// Route to deny a user
router
    .route('/:id/deny')
    .put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.REJECT), user_controller_1.denyUser);
router
    .route('/:id/role')
    .put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), (0, permission_middleware_1.checkPermission)(permission_model_1.ResourceType.USER, permission_model_1.ActionType.ASSIGN), user_controller_1.changeUserRole);
exports.default = router;
