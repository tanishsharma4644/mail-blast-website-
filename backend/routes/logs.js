import express from 'express';
import { query } from 'express-validator';
import { listLogs, logStats } from '../controllers/logsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  [
    query('campaignId').optional().isMongoId().withMessage('campaignId must be a valid ID'),
    query('status').optional().isIn(['all', 'sent', 'failed']).withMessage('Invalid status'),
  ],
  listLogs,
);

router.get('/stats', logStats);

export default router;
