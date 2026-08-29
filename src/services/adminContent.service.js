import { query } from '../lib/database.js';

export const getAllSiteContents = async () => {
  const sql = `
    SELECT sc.id, sc.key, sc.title, sc.content, sc.metadata, sc.updated_by, sc.created_at, sc.updated_at, a.name AS updated_by_name
    FROM site_contents sc
    LEFT JOIN admins a ON sc.updated_by = a.id
    ORDER BY sc.key ASC
  `;
  const result = await query(sql);
  return result.rows;
};

export const getSiteContentByKey = async (key) => {
  const sql = `
    SELECT sc.id, sc.key, sc.title, sc.content, sc.metadata, sc.updated_by, sc.created_at, sc.updated_at, a.name AS updated_by_name
    FROM site_contents sc
    LEFT JOIN admins a ON sc.updated_by = a.id
    WHERE sc.key = $1
  `;
  const result = await query(sql, [key.trim()]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

export const updateSiteContent = async (key, { title, content, metadata = {} }, adminId) => {
  if (!key || typeof key !== 'string') {
    const err = new Error('Content key is required');
    err.statusCode = 400;
    throw err;
  }

  if (content === undefined || content === null) {
    const err = new Error('Content body is required');
    err.statusCode = 400;
    throw err;
  }

  const sql = `
    INSERT INTO site_contents (key, title, content, metadata, updated_by)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (key) 
    DO UPDATE SET 
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING id, key, title, content, metadata, updated_by, created_at, updated_at
  `;

  const result = await query(sql, [
    key.trim(),
    title ? title.trim() : null,
    content,
    JSON.stringify(metadata),
    adminId || null,
  ]);

  return result.rows[0];
};
