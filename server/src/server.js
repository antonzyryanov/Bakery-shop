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

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${env.port}`);
      console.log(`Local:   http://localhost:${env.port}`);
      console.log('Mobile devices on the same network should use http://<PC-LAN-IP>:4000');
    });
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

start();
