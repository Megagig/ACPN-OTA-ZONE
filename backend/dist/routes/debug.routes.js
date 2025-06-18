"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const debug_controller_1 = require("../controllers/debug.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN));
// Debug routes
router.post('/recreate-notifications/:communicationId', debug_controller_1.recreateNotificationsForCommunication);
exports.default = router;
