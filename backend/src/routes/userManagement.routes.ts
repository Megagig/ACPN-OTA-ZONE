import express from 'express';
import multer from 'multer';
import path from 'path';
import userManagementController from '../controllers/userManagement.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getUserPermissions,
  updateUserStatus,
  bulkUpdateUserStatus,
  getAllUsers: getUsersByStatus,
  updateUserRole: assignUserRole,
  bulkUpdateUserRole: bulkAssignUserRole,
  getUserAuditTrail,
  checkUserPermission: checkPermission,
  getFilteredUsers,
  getUserById,
} = userManagementController;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/profile-pictures');
    console.log('Multer destination path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename =
      'profile-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Multer filename:', filename);
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    console.log('Multer fileFilter - file:', file);
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
  },
});

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// User profile routes - accessible by the user themselves
router.route('/profile').get(getUserProfile).put(updateUserProfile);

router
  .route('/profile/picture')
  .put(upload.single('profilePicture'), uploadProfilePicture);

// Routes to manage user permissions and roles
router.route('/permissions').get(getUserPermissions);

// Route to get user by ID
router
  .route('/:id')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getUserById
  );

// Admin routes for user management
router
  .route('/status/:status')
  .get(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getUsersByStatus
  );

router
  .route('/:id/status')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), updateUserStatus);

router
  .route('/bulk/status')
  .put(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), bulkUpdateUserStatus);

router.route('/:id/role').put(authorize(UserRole.SUPERADMIN), assignUserRole);

router
  .route('/bulk/role')
  .put(authorize(UserRole.SUPERADMIN), bulkAssignUserRole);

// Route to get user audit trail
router
  .route('/:id/audit-trail')
  .get(authorize(UserRole.ADMIN, UserRole.SUPERADMIN), getUserAuditTrail);

// Route to check if user has specific permission
router.route('/check-permission/:resource/:action').get(checkPermission);

// Route to get filtered users
router
  .route('/filter')
  .post(
    authorize(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SECRETARY),
    getFilteredUsers
  );

export default router;
