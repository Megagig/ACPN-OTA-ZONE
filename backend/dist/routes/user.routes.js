"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// Route to get pending approval users
router
    .route('/pending-approvals')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), user_controller_1.getPendingApprovalUsers);
// Apply authorization for admin-only routes
router
    .route('/')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), user_controller_1.getUsers)
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), user_controller_1.createUser);
router
    .route('/:id')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), user_controller_1.getUserById)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), user_controller_1.updateUser)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), user_controller_1.deleteUser);
router
    .route('/:id/approve')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), user_controller_1.approveUser);
// Route to deny a user
router
    .route('/:id/deny')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), user_controller_1.denyUser);
router.route('/:id/role').put((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), user_controller_1.changeUserRole);
exports.default = router;
