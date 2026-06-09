import { Router } from 'express';
import { body, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { addProduct, editProduct, listOrders, removeProduct, stats, uploadProductImage } from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validation.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/products');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension) ? extension : '.jpg';
    const uniquePart = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `prd-${uniquePart}${safeExtension}`);
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

router.use(requireAuth, requireAdmin);

router.post('/products/upload-image', upload.single('image'), uploadProductImage);

router.get('/stats', stats);
router.get(
  '/orders',
  query('range')
    .optional()
    .isIn(['last_day', 'last_week', 'last_month', 'last_year', 'custom'])
    .withMessage('Invalid range.'),
  query('from')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('from must be a valid date (YYYY-MM-DD).'),
  query('to')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('to must be a valid date (YYYY-MM-DD).'),
  query('range').custom((rangeValue, { req }) => {
    const range = String(rangeValue || 'last_month');
    if (range !== 'custom') {
      return true;
    }

    const { from, to } = req.query;
    if (!from || !to) {
      throw new Error('from and to are required when range=custom.');
    }

    return true;
  }),
  query('to').custom((toValue, { req }) => {
    const range = String(req.query.range || 'last_month');
    if (range !== 'custom' || !req.query.from || !toValue) {
      return true;
    }

    if (new Date(toValue) < new Date(req.query.from)) {
      throw new Error('to must be greater than or equal to from.');
    }

    return true;
  }),
  handleValidation,
  listOrders
);

router.post(
  '/products',
  body('name').isString().isLength({ min: 2, max: 120 }).withMessage('Name is required.'),
  body('description').isString().isLength({ min: 5, max: 500 }).withMessage('Description is required.'),
  body('imageUrl').isString().isLength({ min: 5, max: 500 }).withMessage('Image URL is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be >= 0.'),
  handleValidation,
  addProduct
);

router.put(
  '/products/:id',
  body('name').isString().isLength({ min: 2, max: 120 }).withMessage('Name is required.'),
  body('description').isString().isLength({ min: 5, max: 500 }).withMessage('Description is required.'),
  body('imageUrl').isString().isLength({ min: 5, max: 500 }).withMessage('Image URL is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be >= 0.'),
  handleValidation,
  editProduct
);

router.delete('/products/:id', removeProduct);

export default router;
