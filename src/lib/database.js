import pg from 'pg';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Initialize PostgreSQL Pool
let pool = null;

if (env.DATABASE_URL) {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' || env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client:', err);
  });
} else {
  logger.warn('DATABASE_URL not configured. Running database queries in mock mode.');
}

/**
 * Execute SQL queries against PostgreSQL pool (or return mock data when DATABASE_URL is not set)
 */
export const query = async (text, params) => {
  if (!pool) {
    logger.debug('Mock Executed Query (No DATABASE_URL):', { text, params });
    // Count queries
    if (text.includes('COUNT(*)')) {
      return { rows: [{ count: '0' }], rowCount: 1 };
    }
    // Admin / User sync query
    if (text.includes('admins')) {
      return {
        rows: [
          {
            id: 'mock-user-uuid',
            name: params?.[0] || 'Test User',
            email: params?.[1] || params?.[0] || 'testuser@example.com',
            role: 'MEMBER',
            picture: null,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      };
    }
    // Contact Request INSERT
    if (text.includes('contact_requests')) {
      return {
        rows: [
          {
            id: 'mock-contact-uuid',
            name: params?.[0] || 'Visitor',
            email: params?.[1] || 'visitor@example.com',
            subject: params?.[2] || 'Subject',
            message: params?.[3] || 'Message',
            status: 'NEW',
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      };
    }
    // Projects INSERT
    if (text.includes('projects')) {
      return {
        rows: [
          {
            id: 'mock-project-uuid',
            title: params?.[0] || 'Sample Project',
            status: 'PENDING',
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      };
    }
    // Default empty result
    return { rows: [], rowCount: 0 };
  }

  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

/**
 * Execute transactional queries
 */
export const transaction = async (callback) => {
  if (!pool) {
    logger.debug('Mock Transaction Executed (No DATABASE_URL)');
    const mockClient = {
      query: async (text, params) => query(text, params),
    };
    return await callback(mockClient);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
