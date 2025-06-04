"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const cache_controller_1 = require("../controllers/cache.controller");
const router = express_1.default.Router();
// Restrict cache management to super admins and admins only
const requireAdminRole = (0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.ADMIN);
// All routes require authentication and admin privileges
router.use(auth_middleware_1.protect, requireAdminRole);
// Cache management routes
router.get('/stats', cache_controller_1.getCacheStats);
router.delete('/', cache_controller_1.clearCache);
router.post('/warm', cache_controller_1.warmCache);
exports.default = router;
