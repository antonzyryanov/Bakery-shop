import { Router } from 'express';
import { getCsrfToken } from '../controllers/securityController.js';

const router = Router();

router.get('/csrf-token', getCsrfToken);

export default router;
