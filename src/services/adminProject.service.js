import { query } from '../lib/database.js';

export const getAllProjects = async ({ page = 1, limit = 20, status, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];
  const queryParams = [];
  let paramIdx = 1;

  if (status) {
    whereConditions.push(`p.status = $${paramIdx}`);
    queryParams.push(status);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(p.title ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) FROM projects p ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  const sql = `
    SELECT 
      p.id, p.title, p.description, p.tech_stack, p.github_url, p.live_url, p.image_id,
      p.submitter_name, p.submitter_email, p.status, p.created_at, p.updated_at,
      i.url AS image_url
    FROM projects p
    LEFT JOIN images i ON p.image_id = i.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const result = await query(sql, [...queryParams, limitNum, offset]);

  return {
    projects: result.rows,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const updateProjectStatus = async (id, { status, title, description, techStack, githubUrl, liveUrl }) => {
  const fields = [];
  const params = [];
  let paramIdx = 1;

  const addField = (colName, val) => {
    if (val !== undefined) {
      fields.push(`${colName} = $${paramIdx}`);
      params.push(val);
      paramIdx++;
    }
  };

  addField('status', status);
  addField('title', title);
  addField('description', description);
  addField('tech_stack', techStack);
  addField('github_url', githubUrl);
  addField('live_url', liveUrl);

  if (fields.length === 0) {
    const err = new Error('No fields provided for update');
    err.statusCode = 400;
    throw err;
  }

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

export const deleteProject = async (id) => {
  const sql = `DELETE FROM projects WHERE id = $1 RETURNING id`;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};
