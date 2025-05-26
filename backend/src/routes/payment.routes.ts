import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../models/user.model';
import {
  submitPayment,
  getPaymentsByDue,
  getPaymentById,
  approvePayment,
  rejectPayment,
  getAllPayments,
  getPaymentsByPharmacy,
  updatePayment,
  deletePayment,
  getPaymentStats,
  getPendingPayments,
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
const requireAdminRole = requireRole([
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.FINANCIAL_SECRETARY,
  UserRole.TREASURER,
]);

// Payment submission routes (for pharmacy owners and admins)
router.post(
  '/submit',
  authenticateToken,
  upload.single('receipt'),
  submitPayment
);
router.put('/:id', authenticateToken, upload.single('receipt'), updatePayment);

// Payment viewing routes
router.get('/due/:dueId', authenticateToken, getPaymentsByDue);
router.get('/pharmacy/:pharmacyId', authenticateToken, getPaymentsByPharmacy);
router.get('/:id', authenticateToken, getPaymentById);

// Admin routes for payment management
router.get('/', authenticateToken, requireAdminRole, getAllPayments);
router.get(
  '/admin/pending',
  authenticateToken,
  requireAdminRole,
  getPendingPayments
);
router.get(
  '/admin/stats',
  authenticateToken,
  requireAdminRole,
  getPaymentStats
);
router.post(
  '/:id/approve',
  authenticateToken,
  requireAdminRole,
  approvePayment
);
router.post('/:id/reject', authenticateToken, requireAdminRole, rejectPayment);
router.delete('/:id', authenticateToken, requireAdminRole, deletePayment);

export default router;
