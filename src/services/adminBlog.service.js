import { query } from '../lib/database.js';

export const getAllBlogs = async ({ page = 1, limit = 20, status, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];
  const queryParams = [];
  let paramIdx = 1;

  if (status) {
    whereConditions.push(`b.status = $${paramIdx}`);
    queryParams.push(status);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(b.title ILIKE $${paramIdx} OR b.excerpt ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) FROM blogs b ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

  const sql = `
    SELECT 
      b.id, b.title, b.slug, b.excerpt, b.content, b.cover_image_id, b.author_name,
      b.tags, b.status, b.published_at, b.created_at, b.updated_at,
      i.url AS cover_image_url
    FROM blogs b
    LEFT JOIN images i ON b.cover_image_id = i.id
    ${whereClause}
    ORDER BY b.created_at DESC
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

export const createBlog = async (blogData) => {
  const { title, slug, excerpt, content, coverImageId, authorName, tags = [], status = 'DRAFT' } = blogData;

  const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const finalSlug = slug ? generateSlug(slug) : generateSlug(title);
  const publishedAt = status === 'PUBLISHED' ? new Date() : null;

  const sql = `
    INSERT INTO blogs (title, slug, excerpt, content, cover_image_id, author_name, tags, status, published_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const result = await query(sql, [
    title.trim(),
    finalSlug,
    excerpt ? excerpt.trim() : null,
    content,
    coverImageId || null,
    authorName.trim(),
    tags,
    status,
    publishedAt,
  ]);

  return result.rows[0];
};

export const updateBlog = async (id, blogData) => {
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

  addField('title', blogData.title);
  if (blogData.slug) addField('slug', blogData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  addField('excerpt', blogData.excerpt);
  addField('content', blogData.content);
  addField('cover_image_id', blogData.coverImageId);
  addField('author_name', blogData.authorName);
  addField('tags', blogData.tags);
  addField('status', blogData.status);

  if (blogData.status === 'PUBLISHED') {
    fields.push(`published_at = COALESCE(published_at, NOW())`);
  }

  if (fields.length === 0) {
    const err = new Error('No fields provided for update');
    err.statusCode = 400;
    throw err;
  }

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE blogs SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    const err = new Error('Blog not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

export const deleteBlog = async (id) => {
  const sql = `DELETE FROM blogs WHERE id = $1 RETURNING id`;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) {
    const err = new Error('Blog not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};
