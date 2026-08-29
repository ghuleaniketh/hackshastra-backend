import { query } from '../lib/database.js';

export const getPublicProjects = async ({ page = 1, limit = 12, tech, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = ["p.status = 'APPROVED'"];
  const queryParams = [];
  let paramIdx = 1;

  if (tech) {
    whereConditions.push(`$${paramIdx} = ANY(p.tech_stack)`);
    queryParams.push(tech);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(p.title ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const countSql = `SELECT COUNT(*) FROM projects p ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  const sql = `
    SELECT 
      p.id, p.title, p.description, p.tech_stack, p.github_url, p.live_url,
      p.image_id, p.submitter_name, p.created_at,
      i.url AS image_url, i.alt_text AS image_alt
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

export const submitProject = async (projectData) => {
  const { title, description, techStack = [], githubUrl, liveUrl, imageId, submitterName, submitterEmail } = projectData;

  if (!title || !title.trim()) {
    const err = new Error('Project title is required');
    err.statusCode = 400;
    throw err;
  }

  if (!description || !description.trim()) {
    const err = new Error('Project description is required');
    err.statusCode = 400;
    throw err;
  }

  if (!submitterName || !submitterName.trim()) {
    const err = new Error('Submitter name is required');
    err.statusCode = 400;
    throw err;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!submitterEmail || !emailRegex.test(submitterEmail.trim())) {
    const err = new Error('Valid submitter email address is required');
    err.statusCode = 400;
    throw err;
  }

  const sql = `
    INSERT INTO projects (title, description, tech_stack, github_url, live_url, image_id, submitter_name, submitter_email, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
    RETURNING id, title, description, tech_stack, github_url, live_url, image_id, submitter_name, submitter_email, status, created_at
  `;

  const result = await query(sql, [
    title.trim(),
    description.trim(),
    techStack,
    githubUrl ? githubUrl.trim() : null,
    liveUrl ? liveUrl.trim() : null,
    imageId || null,
    submitterName.trim(),
    submitterEmail.trim().toLowerCase(),
  ]);

  return result.rows[0];
};
