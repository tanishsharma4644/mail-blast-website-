import express from 'express';
import { body } from 'express-validator';

import {
  sendOtp,
  verifyOtp,
  login,
  verifyLoginOtp,
  refresh,
  logout,
  me,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/send-otp',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
  ],
  sendOtp,
);

router.post(
  '/verify-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  verifyOtp,
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
  ],
  login,
);

router.post(
  '/login/verify-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  verifyLoginOtp,
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
