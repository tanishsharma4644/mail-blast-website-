import express from 'express';
import { body, param } from 'express-validator';
import { addSmtpAccount, getSmtpAccounts, deleteSmtpAccount, toggleSmtpAccount, updateSmtpLimit, resetSmtpCounter } from '../controllers/smtpController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('label').trim().isLength({ min: 2 }).withMessage('Label is required'),
    body('email').trim().isEmail().withMessage('Valid SMTP email is required'),
    body('appPassword').trim().isLength({ min: 6 }).withMessage('App password is required'),
  ],
  addSmtpAccount,
);

router.get('/', getSmtpAccounts);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid ID')], deleteSmtpAccount);
router.patch('/:id/toggle', [param('id').isMongoId().withMessage('Invalid ID')], toggleSmtpAccount);
router.patch(
  '/:id/limit',
  [
    param('id').isMongoId().withMessage('Invalid ID'),
    body('dailyLimit').isInt({ min: 1, max: 100000 }).withMessage('Daily limit must be between 1 and 100000'),
  ],
  updateSmtpLimit,
);
router.patch('/:id/reset', [param('id').isMongoId().withMessage('Invalid ID')], resetSmtpCounter);

export default router;
