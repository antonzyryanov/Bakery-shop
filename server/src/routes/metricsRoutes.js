import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  listActivityEvents,
  listActivityLookups,
  listActivitySummary,
  postActivityEvents
} from '../controllers/metricsController.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validation.js';

const router = Router();

router.post(
  '/events',
  optionalAuth,
  body('events').isArray({ min: 1, max: 50 }).withMessage('events must be a non-empty array.'),
  body('events.*.eventType').isString().notEmpty().withMessage('eventType is required.'),
  body('events.*.platform').isString().isIn(['WEB', 'MOBILE']).withMessage('platform must be WEB or MOBILE.'),
  body('events.*.sessionId').isString().isLength({ min: 8, max: 64 }).withMessage('sessionId is required.'),
  body('events.*.page').optional({ nullable: true }).isString().isLength({ max: 64 }),
  body('events.*.productId').optional({ nullable: true }).isString().isLength({ max: 36 }),
  body('events.*.orderId').optional({ nullable: true }).isString().isLength({ max: 36 }),
  body('events.*.customerId').optional({ nullable: true }).isString().isLength({ max: 36 }),
  body('events.*.attributes').optional().isArray({ max: 20 }),
  body('events.*.meta').optional().isObject(),
  handleValidation,
  postActivityEvents
);

router.get('/lookups', requireAuth, requireAdmin, listActivityLookups);

router.get(
  '/events',
  requireAuth,
  requireAdmin,
  query('eventType').optional().isString().isLength({ max: 64 }),
  query('platform').optional().isString().isLength({ max: 32 }),
  query('page').optional().isString().isLength({ max: 64 }),
  query('customerId').optional().isString().isLength({ max: 36 }),
  query('sessionId').optional().isString().isLength({ max: 64 }),
  query('from').optional().isISO8601({ strict: true }),
  query('to').optional().isISO8601({ strict: true }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidation,
  listActivityEvents
);

router.get(
  '/summary',
  requireAuth,
  requireAdmin,
  query('from').optional().isISO8601({ strict: true }),
  query('to').optional().isISO8601({ strict: true }),
  query('platform').optional().isString().isLength({ max: 32 }),
  handleValidation,
  listActivitySummary
);

export default router;
