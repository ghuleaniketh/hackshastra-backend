import { query } from '../lib/database.js';

export const getAllContactRequests = async ({ page = 1, limit = 20, status, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];
  const queryParams = [];
  let paramIdx = 1;

  if (status) {
    whereConditions.push(`c.status = $${paramIdx}`);
    queryParams.push(status);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(c.name ILIKE $${paramIdx} OR c.email ILIKE $${paramIdx} OR c.subject ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) FROM contact_requests c ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  const sql = `
    SELECT id, name, email, subject, message, status, created_at, updated_at
    FROM contact_requests c
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const result = await query(sql, [...queryParams, limitNum, offset]);

  return {
    contactRequests: result.rows,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const updateContactStatus = async (id, status) => {
  const allowedStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'];
  if (!allowedStatuses.includes(status)) {
    const err = new Error(`Invalid status '${status}'. Allowed statuses: ${allowedStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const sql = `UPDATE contact_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
  const result = await query(sql, [status, id]);

  if (result.rows.length === 0) {
    const err = new Error('Contact request not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};
