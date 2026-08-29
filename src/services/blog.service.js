import { query } from '../lib/database.js';

export const getPublicBlogs = async ({ page = 1, limit = 10, tag, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = ["b.status = 'PUBLISHED'"];
  const queryParams = [];
  let paramIdx = 1;

  if (tag) {
    whereConditions.push(`$${paramIdx} = ANY(b.tags)`);
    queryParams.push(tag);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(b.title ILIKE $${paramIdx} OR b.excerpt ILIKE $${paramIdx} OR b.content ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const countSql = `SELECT COUNT(*) FROM blogs b ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  const sql = `
    SELECT 
      b.id, b.title, b.slug, b.excerpt, b.cover_image_id, b.author_name,
      b.tags, b.published_at, b.created_at,
      i.url AS cover_image_url, i.alt_text AS cover_image_alt
    FROM blogs b
    LEFT JOIN images i ON b.cover_image_id = i.id
    ${whereClause}
    ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const result = await query(sql, [...queryParams, limitNum, offset]);

  return {
    blogs: result.rows,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const getPublicBlogBySlug = async (slug) => {
  const sql = `
    SELECT 
      b.id, b.title, b.slug, b.excerpt, b.content, b.cover_image_id, b.author_name,
      b.tags, b.published_at, b.created_at, b.updated_at,
      i.url AS cover_image_url, i.alt_text AS cover_image_alt
    FROM blogs b
    LEFT JOIN images i ON b.cover_image_id = i.id
    WHERE b.slug = $1 AND b.status = 'PUBLISHED'
  `;

  const result = await query(sql, [slug]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};
