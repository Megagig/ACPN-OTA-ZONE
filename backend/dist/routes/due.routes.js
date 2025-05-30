"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const due_controller_1 = require("../controllers/due.controller");
const fixPaymentStatus_controller_1 = require("../controllers/fixPaymentStatus.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router({ mergeParams: true });
// Protect all routes
router.use(auth_middleware_1.protect);
// Admin roles that can manage dues
const adminAuthorize = (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.TREASURER, user_model_1.UserRole.FINANCIAL_SECRETARY);
// Routes with specific access
router
    .route('/')
    .get((req, res, next) => {
    // If pharmacyId is present in params (from mergeParams), use getPharmacyDues
    // Otherwise, use getAllDues with admin authorization
    if (req.params.pharmacyId) {
        (0, due_controller_1.getPharmacyDues)(req, res, next);
    }
    else {
        // Check admin authorization for getAllDues
        adminAuthorize(req, res, () => {
            (0, due_controller_1.getAllDues)(req, res, next);
        });
    }
})
    .post(adminAuthorize, due_controller_1.createDue);
// Bulk operations
router.post('/bulk-assign', adminAuthorize, due_controller_1.bulkAssignDues);
router.post('/assign/:pharmacyId', adminAuthorize, due_controller_1.assignDueToPharmacy);
// Analytics routes
router.get('/analytics/all', adminAuthorize, due_controller_1.getDueAnalytics);
router.get('/analytics/pharmacy/:pharmacyId', due_controller_1.getPharmacyDueAnalytics);
// Filtered views
router.get('/type/:typeId', adminAuthorize, due_controller_1.getDuesByType);
router.get('/overdue', adminAuthorize, due_controller_1.getOverdueDues);
router.get('/pharmacy/:pharmacyId/history', due_controller_1.getPharmacyPaymentHistory);
// Individual due routes
router
    .route('/:id')
    .get(due_controller_1.getDue)
    .put(adminAuthorize, due_controller_1.updateDue)
    .delete(adminAuthorize, due_controller_1.deleteDue);
// Special due operations
router.post('/:id/penalty', adminAuthorize, due_controller_1.addPenaltyToDue);
router.put('/:id/mark-paid', adminAuthorize, due_controller_1.markDueAsPaid);
router.get('/:id/certificate', due_controller_1.generateClearanceCertificate);
// Certificate generation
router.post('/generate-certificate-pdf', due_controller_1.generatePDFCertificate);
// Legacy payment route (kept for backward compatibility)
router.put('/:id/pay', adminAuthorize, due_controller_1.payDue);
// Fix payment status route
router.post('/fix-payment-status', adminAuthorize, fixPaymentStatus_controller_1.fixDuePaymentStatus);
exports.default = router;
