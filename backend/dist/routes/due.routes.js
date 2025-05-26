"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const due_controller_1 = require("../controllers/due.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router({ mergeParams: true });
// Protect all routes
router.use(auth_middleware_1.protect);
// Routes with specific access
router
    .route('/')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), due_controller_1.getAllDues);
// Individual due routes
router
    .route('/:id')
    .get(due_controller_1.getDue)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), due_controller_1.updateDue)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), due_controller_1.deleteDue);
// Special routes
router
    .route('/:id/pay')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), due_controller_1.payDue);
exports.default = router;
