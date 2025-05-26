"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const dueType_controller_1 = require("../controllers/dueType.controller");
const router = express_1.default.Router();
// Middleware to require admin roles for due type management
const requireFinancialRole = (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.FINANCIAL_SECRETARY, user_model_1.UserRole.TREASURER);
// Public routes (authenticated users can view active due types)
router.get('/:id', auth_middleware_1.protect, dueType_controller_1.getDueType);
// Admin routes for due type management
router.post('/', auth_middleware_1.protect, requireFinancialRole, dueType_controller_1.createDueType);
router.get('/', auth_middleware_1.protect, requireFinancialRole, dueType_controller_1.getDueTypes);
router.put('/:id', auth_middleware_1.protect, requireFinancialRole, dueType_controller_1.updateDueType);
router.delete('/:id', auth_middleware_1.protect, requireFinancialRole, dueType_controller_1.deleteDueType);
exports.default = router;
