import express from 'express';
import { body, param } from 'express-validator';

import {
  createCampaign,
  listCampaigns,
  getCampaign,
  startCampaign,
  stopCampaign,
  deleteCampaign,
} from '../controllers/campaignsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Campaign name is required'),
    body('leadIds').isArray({ min: 1 }).withMessage('At least one lead is required'),
    body('templateIds').isArray({ min: 1 }).withMessage('At least one template is required'),
    body('smtpIds').isArray({ min: 1 }).withMessage('At least one SMTP account is required'),
    body('delayMs').optional().isInt({ min: 200 }).withMessage('Delay must be at least 200ms'),
  ],
  createCampaign,
);

router.get('/', listCampaigns);
router.get('/:id', [param('id').isMongoId().withMessage('Invalid ID')], getCampaign);
router.post('/:id/start', [param('id').isMongoId().withMessage('Invalid ID')], startCampaign);
router.post('/:id/stop', [param('id').isMongoId().withMessage('Invalid ID')], stopCampaign);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid ID')], deleteCampaign);

export default router;
