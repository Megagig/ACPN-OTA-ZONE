"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pharmacy_controller_1 = require("../controllers/pharmacy.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// Search route
router.route('/search').get(pharmacy_controller_1.searchPharmacies);
// Stats route - must come before /:id routes to prevent conflict
router
    .route('/stats')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), pharmacy_controller_1.getPharmacyStats);
// Dues status route
router
    .route('/dues-status')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER), pharmacy_controller_1.getPharmaciesDueStatus);
// Route for the logged-in user's pharmacy
router.route('/me').get(pharmacy_controller_1.getMyPharmacy); // Add this BEFORE the /:id route
// Status update route
router
    .route('/:id/status')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), pharmacy_controller_1.updatePharmacyStatus);
// Standard CRUD routes
router.route('/').get(pharmacy_controller_1.getPharmacies).post(pharmacy_controller_1.createPharmacy);
router
    .route('/:id') // This should come AFTER /me
    .get(pharmacy_controller_1.getPharmacy)
    .put(pharmacy_controller_1.updatePharmacy)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), pharmacy_controller_1.deletePharmacy);
// Import due and donation routes so they can be re-used
const due_routes_1 = __importDefault(require("./due.routes"));
const donation_routes_1 = __importDefault(require("./donation.routes"));
// Re-route into other resource routers
router.use('/:pharmacyId/dues', due_routes_1.default);
router.use('/:pharmacyId/donations', donation_routes_1.default);
exports.default = router;
