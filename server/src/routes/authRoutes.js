import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, profile, register } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validation.js';

const router = Router();

router.post(
  '/register',
  body('email').isEmail().withMessage('Valid email is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must include a number.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must include a special character.'),
  handleValidation,
  register
);

router.post(
  '/login',
  body('identifier').isString().notEmpty().withMessage('Email or login is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidation,
  login
);

router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, profile);

export default router;
