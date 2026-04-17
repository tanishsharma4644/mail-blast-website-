import express from 'express';
import { body, param } from 'express-validator';

import {
  createTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
} from '../controllers/templatesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

const templateValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Template name is required'),
  body('subject').trim().isLength({ min: 3 }).withMessage('Subject is required'),
  body('htmlBody').trim().isLength({ min: 3 }).withMessage('Body is required'),
];

router.post('/', templateValidators, createTemplate);
router.get('/', listTemplates);
router.put('/:id', [param('id').isMongoId().withMessage('Invalid ID'), ...templateValidators], updateTemplate);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid ID')], deleteTemplate);
router.get('/:id/preview', [param('id').isMongoId().withMessage('Invalid ID')], previewTemplate);

export default router;
