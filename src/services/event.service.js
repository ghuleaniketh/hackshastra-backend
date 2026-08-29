import { query } from '../lib/database.js';

export const getPublicEvents = async ({ page = 1, limit = 10, type, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = ["e.status = 'PUBLISHED'"];
  const queryParams = [];
  let paramIdx = 1;

  if (type) {
    whereConditions.push(`e.event_type = $${paramIdx}`);
    queryParams.push(type);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(e.title ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Count query
  const countSql = `SELECT COUNT(*) FROM events e ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  // Data query with verified registration count
  const sql = `
    SELECT 
      e.id,
      e.title,
      e.slug,
      e.description,
      e.event_type,
      e.start_date,
      e.end_date,
      e.location,
      e.registration_enabled,
      e.registration_deadline,
      e.capacity,
      e.status,
      e.created_at,
      e.updated_at,
      i.url AS banner_image_url,
      i.alt_text AS banner_image_alt,
      COALESCE(r.verified_count, 0)::INTEGER AS verified_registrations_count
    FROM events e
    LEFT JOIN images i ON e.banner_image_id = i.id
    LEFT JOIN (
      SELECT event_id, COUNT(*) AS verified_count
      FROM registrations
      WHERE status = 'VERIFIED'
      GROUP BY event_id
    ) r ON e.id = r.event_id
    ${whereClause}
    ORDER BY e.start_date ASC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataParams = [...queryParams, limitNum, offset];
  const result = await query(sql, dataParams);

  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  return {
    events: result.rows,
    pagination: {
      totalItems,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const getPublicEventBySlug = async (slug) => {
  const sql = `
    SELECT 
      e.id,
      e.title,
      e.slug,
      e.description,
      e.event_type,
      e.start_date,
      e.end_date,
      e.location,
      e.registration_enabled,
      e.registration_deadline,
      e.capacity,
      e.status,
      e.created_at,
      e.updated_at,
      i.url AS banner_image_url,
      i.alt_text AS banner_image_alt,
      COALESCE(r.verified_count, 0)::INTEGER AS verified_registrations_count
    FROM events e
    LEFT JOIN images i ON e.banner_image_id = i.id
    LEFT JOIN (
      SELECT event_id, COUNT(*) AS verified_count
      FROM registrations
      WHERE status = 'VERIFIED'
      GROUP BY event_id
    ) r ON e.id = r.event_id
    WHERE e.slug = $1 AND e.status = 'PUBLISHED'
  `;

  const result = await query(sql, [slug]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};
