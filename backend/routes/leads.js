import express from 'express';
import multer from 'multer';
import { body, param } from 'express-validator';

import { addLead, bulkAddLeads, bulkPasteLeads, listLeads, updateLead, deleteLead } from '../controllers/leadsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('company').optional().trim(),
    body('status').optional().isIn(['active', 'unsubscribed']).withMessage('Invalid status'),
  ],
  addLead,
);

router.post('/bulk', upload.single('file'), bulkAddLeads);
router.post('/bulk-paste', bulkPasteLeads);
router.get('/', listLeads);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid ID'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('company').optional().trim(),
    body('status').optional().isIn(['active', 'unsubscribed']).withMessage('Invalid status'),
  ],
  updateLead,
);

router.delete('/:id', [param('id').isMongoId().withMessage('Invalid ID')], deleteLead);

export default router;
