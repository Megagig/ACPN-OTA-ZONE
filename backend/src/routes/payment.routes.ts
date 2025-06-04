import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  protect as authenticateToken,
  authorize as requireRole,
} from '../middleware/auth.middleware';
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from '../middleware/cache.middleware';
import { UserRole } from '../models/user.model';
import {
  submitPayment,
  getPaymentById,
  getDuePayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  reviewPayment,
  getPendingPayments,
  deletePayment,
} from '../controllers/payment.controller';

const router = express.Router();

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path for better reliability
    const uploadPath = path.join(__dirname, '../../uploads/receipts');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only PDF, JPEG, JPG, PNG files
  const allowedTypes = /pdf|jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, JPG, and PNG files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for admin roles
const requireAdminRole = requireRole(
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.FINANCIAL_SECRETARY,
  UserRole.TREASURER
);

// Payment submission routes (for pharmacy owners and admins)
// Create a middleware to handle upload errors
const handleUploadErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  upload.single('receipt')(req, res, (err) => {
    if (err) {
      console.error('File upload error:', err);

      // Provide more detailed error information
      let errorMessage = 'Error uploading file';
      let errorDetails = {};

      if (err instanceof multer.MulterError) {
        // A Multer error occurred
        errorMessage = `Multer error: ${err.code}`;
        errorDetails = { code: err.code, field: err.field };
      } else if (err instanceof Error) {
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
    } else {
      console.warn('No file uploaded but no error reported');
    }

    next();
  });
};

router.post('/submit', authenticateToken, handleUploadErrors, submitPayment);

// Payment viewing routes
router.get(
  '/due/:dueId',
  authenticateToken,
  cacheMiddleware('payments-due', { ttl: 120 }), // Cache for 2 minutes
  getDuePayments
);

// Admin routes for payment management
router.get(
  '/admin/all',
  authenticateToken,
  requireAdminRole,
  cacheMiddleware('payments-admin', { ttl: 180 }), // Cache for 3 minutes
  getAllPayments
);
router.get(
  '/admin/pending',
  authenticateToken,
  requireAdminRole,
  cacheMiddleware('payments-pending', { ttl: 60 }), // Cache for 1 minute (important to stay fresh)
  getPendingPayments
);

// Single payment route
router.get(
  '/:id',
  authenticateToken,
  cacheMiddleware('payment-single', { ttl: 120 }), // Cache for 2 minutes
  getPaymentById
);

router.post(
  '/:id/approve',
  authenticateToken,
  requireAdminRole,
  clearCacheMiddleware('payments'),
  approvePayment
);
router.post(
  '/:id/reject',
  authenticateToken,
  requireAdminRole,
  clearCacheMiddleware('payments'),
  rejectPayment
);
router.post(
  '/:id/review',
  authenticateToken,
  requireAdminRole,
  clearCacheMiddleware('payments'),
  reviewPayment
);
router.delete(
  '/:id',
  authenticateToken,
  requireAdminRole,
  clearCacheMiddleware('payments'),
  deletePayment
);

export default router;
