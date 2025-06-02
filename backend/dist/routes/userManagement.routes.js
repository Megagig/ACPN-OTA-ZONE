"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const userManagement_controller_1 = __importDefault(require("../controllers/userManagement.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const { getUserProfile, updateUserProfile, uploadProfilePicture, getUserPermissions, updateUserStatus, bulkUpdateUserStatus, getAllUsers: getUsersByStatus, updateUserRole: assignUserRole, bulkUpdateUserRole: bulkAssignUserRole, getUserAuditTrail, checkUserPermission: checkPermission, getFilteredUsers, } = userManagement_controller_1.default;
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, '../../uploads/profile-pictures'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'profile-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
    },
});
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_middleware_1.protect);
// User profile routes - accessible by the user themselves
router.route('/profile').get(getUserProfile).put(updateUserProfile);
router
    .route('/profile/picture')
    .put(upload.single('profilePicture'), uploadProfilePicture);
// Routes to manage user permissions and roles
router.route('/permissions').get(getUserPermissions);
// Admin routes for user management
router
    .route('/status/:status')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), getUsersByStatus);
router
    .route('/:id/status')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), updateUserStatus);
router
    .route('/bulk/status')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), bulkUpdateUserStatus);
router.route('/:id/role').put((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), assignUserRole);
router
    .route('/bulk/role')
    .put((0, auth_middleware_1.authorize)(user_model_1.UserRole.SUPERADMIN), bulkAssignUserRole);
// Route to get user audit trail
router
    .route('/:id/audit-trail')
    .get((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN), getUserAuditTrail);
// Route to check if user has specific permission
router.route('/check-permission/:resource/:action').get(checkPermission);
// Route to get filtered users
router
    .route('/filter')
    .post((0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.SECRETARY), getFilteredUsers);
exports.default = router;
