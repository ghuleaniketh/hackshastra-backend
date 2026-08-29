import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../lib/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Initializing PostgreSQL database schema...');
    await query(sql);
    logger.info('PostgreSQL database schema initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize database schema:', error.message);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
