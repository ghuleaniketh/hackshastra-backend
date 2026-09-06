import { query } from '../lib/database.js';

export const getTeamDirectory = async () => {
  const sql = `SELECT content, metadata FROM site_contents WHERE key = $1`;
  const res = await query(sql, ['team_directory']);
  if (res.rows.length > 0) {
    try {
      const parsed = typeof res.rows[0].content === 'string' 
        ? JSON.parse(res.rows[0].content) 
        : res.rows[0].content;
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
};

export const getTeamRoster = getTeamDirectory;

export const updateTeamDirectory = async (teamData, adminId) => {
  const contentStr = typeof teamData === 'string' ? teamData : JSON.stringify(teamData);
  const sql = `
    INSERT INTO site_contents (key, title, content, metadata, updated_by)
    VALUES ('team_directory', 'Community Team Directory', $1, '{}'::jsonb, $2)
    ON CONFLICT (key) 
    DO UPDATE SET 
      content = EXCLUDED.content,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
  `;
  const res = await query(sql, [contentStr, adminId || null]);
  return res.rows[0];
};
