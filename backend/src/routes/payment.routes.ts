import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  protect as authenticateToken,
  authorize as requireRole,
} from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import {
  submitPayment,
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
    cb(null, 'uploads/receipts/');
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
router.post(
  '/submit',
  authenticateToken,
  upload.single('receipt'),
  submitPayment
);

// Payment viewing routes
router.get('/due/:dueId', authenticateToken, getDuePayments);

// Admin routes for payment management
router.get('/admin/all', authenticateToken, requireAdminRole, getAllPayments);
router.get(
  '/admin/pending',
  authenticateToken,
  requireAdminRole,
  getPendingPayments
);
router.post(
  '/:id/approve',
  authenticateToken,
  requireAdminRole,
  approvePayment
);
router.post('/:id/reject', authenticateToken, requireAdminRole, rejectPayment);
router.post('/:id/review', authenticateToken, requireAdminRole, reviewPayment);
router.delete('/:id', authenticateToken, requireAdminRole, deletePayment);

export default router;
