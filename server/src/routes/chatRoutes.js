import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminChat,
  getMyChat,
  listAdminChats,
  postAdminChatMessage,
  postMyChatMessage
} from '../controllers/chatController.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validation.js';

const router = Router();

router.get('/me', requireAuth, getMyChat);
router.post(
  '/me/messages',
  requireAuth,
  body('body').isString().isLength({ min: 1, max: 2000 }).withMessage('Message body is required.'),
  handleValidation,
  postMyChatMessage
);

router.get('/admin/conversations', requireAuth, requireAdmin, listAdminChats);
router.get('/admin/conversations/:id', requireAuth, requireAdmin, getAdminChat);
router.post(
  '/admin/conversations/:id/messages',
  requireAuth,
  requireAdmin,
  body('body').isString().isLength({ min: 1, max: 2000 }).withMessage('Message body is required.'),
  handleValidation,
  postAdminChatMessage
);

export default router;
