import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  verifyEmail,
  verifyEmailWithCode,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import {
  authRateLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} from '../middleware/rate-limit.middleware';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.put('/reset-password/:token', passwordResetLimiter, resetPassword);
router.put('/update-details', protect, updateDetails);
router.put('/update-password', protect, updatePassword);
router.get('/verify-email/:token', emailVerificationLimiter, verifyEmail);
router.post(
  '/verify-email-code',
  emailVerificationLimiter,
  verifyEmailWithCode
);

export default router;
