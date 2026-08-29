import { query } from '../lib/database.js';

export const getPublicSiteContentByKey = async (key) => {
  const sql = `SELECT id, key, title, content, metadata, updated_at FROM site_contents WHERE key = $1`;
  const result = await query(sql, [key.trim()]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};
