import { verifyAccessToken } from '../utils/jwt.js';

const readAccessToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return req.cookies?.access_token || null;
};

export const optionalAuth = (req, res, next) => {
  try {
    const token = readAccessToken(req);
    if (!token) {
      return next();
    }

    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    return next();
  }
};

export const requireAuth = (req, res, next) => {
  try {
    const token = readAccessToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
};

export const hasBearerAuth = (req) => {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ');
};

export const isMobileClient = (req) => {
  const platform = String(req.headers['x-client-platform'] || '').toUpperCase();
  return platform === 'MOBILE';
};
