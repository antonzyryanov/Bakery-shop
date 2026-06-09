import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const uploadsPath = path.resolve(__dirname, '../uploads');
const useAbuseProtection = env.nodeEnv === 'production';

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);

app.use(morgan('combined'));

if (useAbuseProtection) {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 400,
      standardHeaders: 'draft-7',
      legacyHeaders: false
    })
  );

  app.use(
    slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 150,
      delayMs: () => 250
    })
  );
}

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax', secure: false } });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/security', csrfProtection, securityRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', csrfProtection, authRoutes);
app.use('/api/orders', csrfProtection, orderRoutes);
app.use('/api/admin', csrfProtection, adminRoutes);

app.use('/uploads', express.static(uploadsPath));
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  return res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
