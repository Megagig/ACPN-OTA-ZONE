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
const cache_middleware_1 = require("../middleware/cache.middleware");
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
        console.log('Multer: Using upload path:', uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Keep the original file extension but sanitize and make unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileExt = path_1.default.extname(originalName) || '.jpg'; // Default to .jpg if no extension
        const newFilename = 'receipt-' + uniqueSuffix + fileExt;
        console.log('Multer: Generated filename:', newFilename, 'for original:', file.originalname);
        cb(null, newFilename);
    },
});
const fileFilter = (req, file, cb) => {
    // Accept only PDF, JPEG, JPG, PNG files
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    console.log('Multer: Checking file:', file.originalname, 'mimetype:', file.mimetype, 'valid ext:', extname, 'valid mime:', mimetype);
    if (extname && mimetype) {
        console.log('File accepted:', file.originalname, file.mimetype);
        return cb(null, true);
    }
    else {
        console.log('File rejected:', file.originalname, file.mimetype);
        cb(new Error(`Only PDF, JPEG, JPG, and PNG files are allowed. Got: ${file.mimetype}`));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Increased to 10MB limit
        files: 1, // Only one file at a time
        fieldSize: 15 * 1024 * 1024, // Increased field size limit for encoded files
        parts: 20, // Allow up to 20 parts in the multipart form (fields + files)
    },
    fileFilter: fileFilter,
});
// Middleware for admin roles
const requireAdminRole = (0, auth_middleware_1.authorize)(user_model_1.UserRole.ADMIN, user_model_1.UserRole.SUPERADMIN, user_model_1.UserRole.FINANCIAL_SECRETARY, user_model_1.UserRole.TREASURER);
// Payment submission routes (for pharmacy owners and admins)
// Create a middleware to handle upload errors
const handleUploadErrors = (req, res, next) => {
    // Log request information before processing
    console.log('Handling payment upload request. Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body keys (pre-multer):', Object.keys(req.body || {}));
    // Check if the request is unusually large (pre-emptive check)
    const contentLength = Number(req.headers['content-length'] || 0);
    const maxSize = 15 * 1024 * 1024; // 15MB max total request size
    if (contentLength > maxSize) {
        console.error(`Request too large: ${contentLength} bytes exceeds ${maxSize} bytes`);
        res.status(413).json({
            success: false,
            error: 'Request entity too large',
            details: {
                received: contentLength,
                maxAllowed: maxSize,
                hint: 'Please reduce the file size and try again',
            },
        });
        return; // Return without calling next()
    }
    // Check if the content type is correct for file uploads
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        console.error('Invalid content type for file upload:', contentType);
        res.status(400).json({
            success: false,
            error: 'Invalid request format. Must use multipart/form-data for file uploads.',
            details: { contentType },
        });
        return; // Return without calling next()
    }
    // Use multer with increased timeouts and improved error handling
    upload.single('receipt')(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err);
            // Provide more detailed error information
            let errorMessage = 'Error uploading file';
            let errorDetails = {};
            let statusCode = 400;
            if (err instanceof multer_1.default.MulterError) {
                // A Multer error occurred
                errorMessage = `Multer error: ${err.code}`;
                errorDetails = { code: err.code, field: err.field, message: err.message }; // Include original message
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = 'File is too large. Maximum size is 10MB.';
                }
                else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    errorMessage =
                        'Unexpected file field. Use "receipt" as the field name.';
                }
                else if (err.code === 'LIMIT_PART_COUNT') {
                    errorMessage = 'Too many parts in the multipart form.';
                }
                else if (err.code === 'LIMIT_FIELD_KEY') {
                    errorMessage = 'Field name too long.';
                }
                else if (err.code === 'LIMIT_FIELD_VALUE') {
                    errorMessage = 'Field value too long.';
                }
                else if (err.code === 'LIMIT_FIELD_COUNT') {
                    errorMessage = 'Too many fields in the form.';
                }
            }
            else if (err instanceof Error) {
                // A general error occurred
                errorMessage = err.message; // Default to original error message
                errorDetails = {
                    name: err.name,
                    message: err.message, // Keep original message in details
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                };
                // Check for specific errors with improved messages and hints
                if (err.message.includes('Unexpected end of form')) {
                    errorMessage =
                        'Upload interrupted or incomplete. Please try again with a smaller file or better connection.';
                    statusCode = 400;
                    errorDetails.hint =
                        'This usually happens when the upload is interrupted, the connection is unstable, or server timeouts are hit.';
                }
                else if (err.message.includes('Unexpected end of multipart data')) {
                    errorMessage = 'Upload interrupted or incomplete. Please try again.';
                    statusCode = 400;
                    errorDetails.hint = 'The upload was cut off before completing.';
                }
                else if (err.message.includes('timeout')) {
                    errorMessage = 'Upload timed out. Please try with a smaller file.';
                    statusCode = 408;
                    errorDetails.hint = 'The server took too long to process the upload.';
                }
                else if (err.message.includes('Only PDF, JPEG, JPG, and PNG files are allowed')) {
                    // This handles the error from our custom fileFilter
                    errorMessage = err.message;
                    statusCode = 400;
                    errorDetails.hint = 'Ensure the file is one of the accepted types: PDF, JPEG, JPG, PNG.';
                }
            }
            res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: errorDetails,
            });
            return; // Return without calling next()
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
            // If we get here without a file and without an error, it's a problem
            res.status(400).json({
                success: false,
                error: 'No receipt file was provided',
                details: {
                    hint: 'Make sure you included a file with field name "receipt"',
                },
            });
            return; // Return without calling next()
        }
        next();
    });
};
router.post('/submit', auth_middleware_1.protect, handleUploadErrors, payment_controller_1.submitPayment);
// Payment viewing routes
router.get('/due/:dueId', auth_middleware_1.protect, (0, cache_middleware_1.cacheMiddleware)('payments-due', { ttl: 120 }), // Cache for 2 minutes
payment_controller_1.getDuePayments);
// Admin routes for payment management
router.get('/admin/all', auth_middleware_1.protect, requireAdminRole, (0, cache_middleware_1.cacheMiddleware)('payments-admin', { ttl: 180 }), // Cache for 3 minutes
payment_controller_1.getAllPayments);
router.get('/admin/pending', auth_middleware_1.protect, requireAdminRole, (0, cache_middleware_1.cacheMiddleware)('payments-pending', { ttl: 60 }), // Cache for 1 minute (important to stay fresh)
payment_controller_1.getPendingPayments);
// Single payment route
router.get('/:id', auth_middleware_1.protect, (0, cache_middleware_1.cacheMiddleware)('payment-single', { ttl: 120 }), // Cache for 2 minutes
payment_controller_1.getPaymentById);
router.post('/:id/approve', auth_middleware_1.protect, requireAdminRole, (0, cache_middleware_1.clearCacheMiddleware)('payments'), payment_controller_1.approvePayment);
router.post('/:id/reject', auth_middleware_1.protect, requireAdminRole, (0, cache_middleware_1.clearCacheMiddleware)('payments'), payment_controller_1.rejectPayment);
router.post('/:id/review', auth_middleware_1.protect, requireAdminRole, (0, cache_middleware_1.clearCacheMiddleware)('payments'), payment_controller_1.reviewPayment);
router.delete('/:id', auth_middleware_1.protect, requireAdminRole, (0, cache_middleware_1.clearCacheMiddleware)('payments'), payment_controller_1.deletePayment);
// Add a new endpoint for recording any payment type
router.post('/record', auth_middleware_1.protect, requireAdminRole, handleUploadErrors, requireAdminRole, (0, cache_middleware_1.clearCacheMiddleware)('payments'), payment_controller_1.recordPayment);
exports.default = router;
