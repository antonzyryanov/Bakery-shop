import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  extraCorsOrigins: process.env.EXTRA_CORS_ORIGINS || 'http://localhost:8081,http://localhost:19006',
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bakery_shop'
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '1d',
  redisEnabled: (process.env.REDIS_ENABLED || 'true').toLowerCase() === 'true',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@bakery.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Ko1337Bra?'
};
