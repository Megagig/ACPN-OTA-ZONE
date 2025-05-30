"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router({ mergeParams: true });
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// Routes that apply to /api/documents
router
    .route('/expiring')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), document_controller_1.getExpiringDocuments);
router
    .route('/:id')
    .get(document_controller_1.getDocument)
    .put(document_controller_1.updateDocument)
    .delete(document_controller_1.deleteDocument);
// Download route
router.route('/:id/download').get(document_controller_1.downloadDocument);
// Routes that apply to /api/pharmacies/:pharmacyId/documents
router.route('/').get(document_controller_1.getPharmacyDocuments).post(document_controller_1.uploadDocument);
exports.default = router;
