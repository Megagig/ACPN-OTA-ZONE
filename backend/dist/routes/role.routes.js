"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// Routes that require SuperAdmin or Admin access
router
    .route('/')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), role_controller_1.getRoles)
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), role_controller_1.createRole);
// Route to initialize default roles (must come before /:id route)
router
    .route('/initialize/default')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), role_controller_1.initializeRoles);
router
    .route('/:id')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), role_controller_1.getRoleById)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), role_controller_1.updateRole)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), role_controller_1.deleteRole);
// Routes for managing permissions in a role
router
    .route('/:id/permissions/:permissionId')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), role_controller_1.addPermissionToRole)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), role_controller_1.removePermissionFromRole);
// Route to get users with a specific role
router
    .route('/:id/users')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), role_controller_1.getUsersWithRole);
exports.default = router;
