"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const communication_controller_1 = require("../controllers/communication.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_middleware_1.protect);
// User routes
router.route('/inbox').get(communication_controller_1.getUserInbox);
router.route('/sent').get(communication_controller_1.getUserSentCommunications);
router.route('/:id/read').put(communication_controller_1.markAsRead);
// Admin routes
router
    .route('/admin')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), communication_controller_1.getAllAdminCommunications);
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), communication_controller_1.getCommunicationStats);
// Mixed routes
router.route('/').post(communication_controller_1.createCommunication);
router.route('/:id').get(communication_controller_1.getCommunication).delete(communication_controller_1.deleteCommunication);
// Communication action routes
router.route('/:id/send').post(communication_controller_1.sendCommunication);
router.route('/:id/schedule').post(communication_controller_1.scheduleCommunication);
router.route('/:id/recipients').get(communication_controller_1.getCommunicationRecipients);
exports.default = router;
