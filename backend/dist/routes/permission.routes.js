"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const permission_controller_1 = require("../controllers/permission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// Routes that require SuperAdmin access
router
    .route('/')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), permission_controller_1.getPermissions)
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), permission_controller_1.createPermission);
router
    .route('/:id')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), permission_controller_1.getPermissionById)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), permission_controller_1.updatePermission)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), permission_controller_1.deletePermission);
router
    .route('/initialize/default')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), permission_controller_1.initializePermissions);
exports.default = router;
