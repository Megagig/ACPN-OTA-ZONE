"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const donation_controller_1 = require("../controllers/donation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router({ mergeParams: true });
// Protect all routes
router.use(auth_middleware_1.protect);
// Routes with specific access
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), donation_controller_1.getDonationStats);
router
    .route('/')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), donation_controller_1.getAllDonations);
// Individual donation routes
router
    .route('/:id')
    .get(donation_controller_1.getDonation)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), donation_controller_1.updateDonation)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), donation_controller_1.deleteDonation);
// Special routes
router
    .route('/:id/acknowledge')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), donation_controller_1.acknowledgeDonation);
exports.default = router;
