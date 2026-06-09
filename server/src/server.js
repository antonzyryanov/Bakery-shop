import app from './app.js';
import { env } from './config/env.js';
import { db } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { bootstrapAdmin } from './services/authService.js';
import { runRequiredMigrations } from './services/dbMigrationService.js';

const start = async () => {
  try {
    await db.query('SELECT 1');
    console.log('MySQL connected');

    await runRequiredMigrations();

    await connectRedis();
    await bootstrapAdmin();

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

start();
