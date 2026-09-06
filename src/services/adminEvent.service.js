import { query } from '../lib/database.js';

export const getAllEvents = async ({ page = 1, limit = 20, status, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];
  const queryParams = [];
  let paramIdx = 1;

  if (status) {
    whereConditions.push(`e.status = $${paramIdx}`);
    queryParams.push(status);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(e.title ILIKE $${paramIdx} OR e.description ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) FROM events e ${whereClause}`;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0].count, 10);

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
      e.banner_image_id,
      e.registration_enabled,
      e.registration_deadline,
      e.capacity,
      e.status,
      e.created_at,
      e.updated_at,
      i.url AS banner_image_url,
      COALESCE(r.total_count, 0)::INTEGER AS total_registrations_count,
      COALESCE(r.verified_count, 0)::INTEGER AS verified_registrations_count
    FROM events e
    LEFT JOIN images i ON e.banner_image_id = i.id
    LEFT JOIN (
      SELECT 
        event_id, 
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified_count
      FROM registrations
      GROUP BY event_id
    ) r ON e.id = r.event_id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataParams = [...queryParams, limitNum, offset];
  const result = await query(sql, dataParams);

  return {
    events: result.rows,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const createEvent = async (eventData) => {
  const {
    title,
    slug,
    description,
    eventType,
    startDate,
    endDate,
    location,
    bannerImageId,
    registrationEnabled = true,
    registrationDeadline,
    capacity,
    status = 'DRAFT',
  } = eventData;

  const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const finalSlug = slug ? generateSlug(slug) : generateSlug(title);

  const sql = `
    INSERT INTO events (
      title, slug, description, event_type, start_date, end_date, location,
      banner_image_id, registration_enabled, registration_deadline, capacity, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const result = await query(sql, [
    title.trim(),
    finalSlug,
    description,
    eventType,
    startDate,
    endDate,
    location.trim(),
    bannerImageId || null,
    registrationEnabled,
    registrationDeadline || null,
    capacity,
    status,
  ]);

  return result.rows[0];
};

export const updateEvent = async (id, eventData) => {
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

  addField('title', eventData.title);
  if (eventData.slug) addField('slug', eventData.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  addField('description', eventData.description);
  addField('event_type', eventData.eventType);
  addField('start_date', eventData.startDate);
  addField('end_date', eventData.endDate);
  addField('location', eventData.location);
  addField('banner_image_id', eventData.bannerImageId);
  addField('registration_enabled', eventData.registrationEnabled);
  addField('registration_deadline', eventData.registrationDeadline);
  addField('capacity', eventData.capacity);
  addField('status', eventData.status);

  if (fields.length === 0) {
    const err = new Error('No fields provided for update');
    err.statusCode = 400;
    throw err;
  }

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

export const deleteEvent = async (id) => {
  const sql = `DELETE FROM events WHERE id = $1 RETURNING id`;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

export const getEventRegistrations = async (eventId, { page = 1, limit = 50, status, favouritePokemon, participationInterest, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = ['(r.event_id::text = $1 OR e.slug = $1)'];
  const queryParams = [eventId];
  let paramIdx = 2;

  if (status) {
    whereConditions.push(`r.status = $${paramIdx}`);
    queryParams.push(status);
    paramIdx++;
  }

  if (favouritePokemon) {
    whereConditions.push(`r.favourite_pokemon ILIKE $${paramIdx}`);
    queryParams.push(favouritePokemon);
    paramIdx++;
  }

  if (participationInterest) {
    whereConditions.push(`r.participation_interest = $${paramIdx}`);
    queryParams.push(participationInterest);
    paramIdx++;
  }

  if (search) {
    whereConditions.push(`(r.full_name ILIKE $${paramIdx} OR r.email ILIKE $${paramIdx} OR r.student_id ILIKE $${paramIdx})`);
    queryParams.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const countSql = `
    SELECT COUNT(*) 
    FROM registrations r 
    JOIN events e ON r.event_id = e.id 
    ${whereClause}
  `;
  const countResult = await query(countSql, queryParams);
  const totalItems = parseInt(countResult.rows[0]?.count || 0, 10);

  const sql = `
    SELECT 
      r.id, r.event_id, r.full_name, r.email, r.phone, r.college, r.organization, r.year,
      r.student_id, r.gender, r.department, r.favourite_pokemon, r.participation_interest,
      r.additional_information, r.status, r.verified_at, r.created_at,
      e.title AS event_title, e.slug AS event_slug
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const result = await query(sql, [...queryParams, limitNum, offset]);

  return {
    registrations: result.rows,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};
