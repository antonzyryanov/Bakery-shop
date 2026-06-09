import { Router } from 'express';
import { body } from 'express-validator';
import { createOrder, listMyOrders } from '../controllers/orderController.js';
import { requireAuth } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validation.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  body('items').isArray({ min: 1 }).withMessage('Items are required.'),
  body('items.*.productId').isString().notEmpty().withMessage('productId is required.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be >= 1.'),
  body('phoneNumber').optional().isString().isLength({ max: 40 }).withMessage('phoneNumber is invalid.'),
  body('adress').optional().isString().isLength({ max: 300 }).withMessage('adress is invalid.'),
  handleValidation,
  createOrder
);

router.get('/mine', requireAuth, listMyOrders);

export default router;
