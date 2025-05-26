"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const poll_controller_1 = require("../controllers/poll.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Protect all routes
router.use(auth_middleware_1.protect);
// Public routes (still protected but available to all logged-in users)
router.route('/').get(poll_controller_1.getAllPolls);
router.route('/:id').get(poll_controller_1.getPoll);
router.route('/:id/respond').post(poll_controller_1.respondToPoll);
// Admin/Secretary routes
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), poll_controller_1.getPollStats);
router
    .route('/')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), poll_controller_1.createPoll);
router
    .route('/:id')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), poll_controller_1.updatePoll)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), poll_controller_1.deletePoll);
router
    .route('/:id/publish')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), poll_controller_1.publishPoll);
router
    .route('/:id/close')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), poll_controller_1.closePoll);
router
    .route('/:id/results')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), poll_controller_1.getPollResults);
exports.default = router;
