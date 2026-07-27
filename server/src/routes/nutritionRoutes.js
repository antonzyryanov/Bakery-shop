import { Router } from 'express';
import { body, query } from 'express-validator';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {
  createEntry,
  ensureNutritionUser,
  listEntries,
  nutritionUploadDirPath,
  stats
} from '../controllers/nutritionController.js';
import { requireAuth } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validation.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(nutritionUploadDirPath, { recursive: true });
    cb(null, nutritionUploadDirPath);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension) ? extension : '.jpg';
    const uniquePart = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `dish-${uniquePart}${safeExtension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      const error = new Error('Only image files are allowed.');
      error.status = 400;
      cb(error);
      return;
    }
    cb(null, true);
  }
});

router.use(requireAuth, ensureNutritionUser);

router.get(
  '/entries',
  query('range').optional().isIn(['last_day', 'last_week', 'last_month', 'custom']),
  handleValidation,
  listEntries
);

router.get(
  '/stats',
  query('range').optional().isIn(['last_day', 'last_week', 'last_month', 'custom']),
  handleValidation,
  stats
);

router.post(
  '/entries',
  upload.single('image'),
  body('dishName').isString().trim().isLength({ min: 1, max: 255 }),
  body('calories').isFloat({ min: 0 }),
  body('proteins').isFloat({ min: 0 }),
  body('fats').isFloat({ min: 0 }),
  body('carbohydrates').isFloat({ min: 0 }),
  body('description').isString().trim().isLength({ min: 1, max: 4000 }),
  body('eatenAt').optional().isISO8601(),
  handleValidation,
  createEntry
);

export default router;
