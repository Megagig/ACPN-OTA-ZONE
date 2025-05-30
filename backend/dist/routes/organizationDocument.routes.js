"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organizationDocument_controller_1 = require("../controllers/organizationDocument.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// Summary route - must come before /:id routes
router
    .route('/summary')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), organizationDocument_controller_1.getDocumentSummary);
// Main document routes
router
    .route('/')
    .get(organizationDocument_controller_1.getOrganizationDocuments)
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), organizationDocument_controller_1.uploadOrganizationDocument);
// Document-specific routes
router
    .route('/:id')
    .get(organizationDocument_controller_1.getOrganizationDocument)
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), organizationDocument_controller_1.updateOrganizationDocument)
    .delete((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), organizationDocument_controller_1.deleteOrganizationDocument);
// Archive route
router
    .route('/:id/archive')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), organizationDocument_controller_1.archiveOrganizationDocument);
// Download route
router.route('/:id/download').get(organizationDocument_controller_1.downloadOrganizationDocument);
// Version routes
router
    .route('/:id/versions')
    .get(organizationDocument_controller_1.getDocumentVersions)
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), organizationDocument_controller_1.uploadDocumentVersion);
exports.default = router;
