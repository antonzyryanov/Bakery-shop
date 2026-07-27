import { db } from '../src/config/db.js';
import { runRequiredMigrations } from '../src/services/dbMigrationService.js';

await runRequiredMigrations();
const [rows] = await db.query("SHOW TABLES LIKE 'metric_%'");
console.log('Metric tables:', rows);
process.exit(0);
