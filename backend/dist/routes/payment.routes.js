"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
// Configure multer for receipt uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Use absolute path for better reliability
        const uploadPath = path_1.default.join(__dirname, '../../uploads/receipts');
        // Ensure directory exists
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'receipt-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    // Accept only PDF, JPEG, JPG, PNG files
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only PDF, JPEG, JPG, and PNG files are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter,
});
// Middleware for admin roles
const requireAdminRole = (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.FINANCIAL_SECRETARY, user_model_1.UserRole.TREASURER);
// Payment submission routes (for pharmacy owners and admins)
// Create a middleware to handle upload errors
const handleUploadErrors = (req, res, next) => {
    upload.single('receipt')(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err);
            // Provide more detailed error information
            let errorMessage = 'Error uploading file';
            let errorDetails = {};
            if (err instanceof multer_1.default.MulterError) {
                // A Multer error occurred
                errorMessage = `Multer error: ${err.code}`;
                errorDetails = { code: err.code, field: err.field };
            }
            else if (err instanceof Error) {
                // A general error occurred
                errorMessage = err.message;
                errorDetails = {
                    name: err.name,
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                };
            }
            return res.status(400).json({
                success: false,
                error: errorMessage,
                details: errorDetails,
            });
        }
        // Log successful upload
        if (req.file) {
            console.log('File uploaded successfully:', {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });
        }
        else {
            console.warn('No file uploaded but no error reported');
        }
        next();
    });
};
router.post('/submit', auth_middleware_1.protect, handleUploadErrors, payment_controller_1.submitPayment);
// Payment viewing routes
router.get('/due/:dueId', auth_middleware_1.protect, payment_controller_1.getDuePayments);
// Admin routes for payment management
router.get('/admin/all', auth_middleware_1.protect, requireAdminRole, payment_controller_1.getAllPayments);
router.get('/admin/pending', auth_middleware_1.protect, requireAdminRole, payment_controller_1.getPendingPayments);
router.post('/:id/approve', auth_middleware_1.protect, requireAdminRole, payment_controller_1.approvePayment);
router.post('/:id/reject', auth_middleware_1.protect, requireAdminRole, payment_controller_1.rejectPayment);
router.post('/:id/review', auth_middleware_1.protect, requireAdminRole, payment_controller_1.reviewPayment);
router.delete('/:id', auth_middleware_1.protect, requireAdminRole, payment_controller_1.deletePayment);
exports.default = router;
