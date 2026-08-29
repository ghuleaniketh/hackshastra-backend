import { query } from '../lib/database.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Validate image metadata before processing
 */
export const validateImageMetadata = ({ mimeType, fileSize }) => {
  const errors = [];
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    errors.push(`Invalid image type '${mimeType}'. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed limit of 10MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Request Cloudflare Images direct upload URL
 */
export const createDirectUploadUrl = async () => {
  const isRealCloudflareKey =
    env.CLOUDFLARE_ACCOUNT_ID &&
    env.CLOUDFLARE_API_TOKEN &&
    !env.CLOUDFLARE_ACCOUNT_ID.includes('your_') &&
    !env.CLOUDFLARE_API_TOKEN.includes('your_');

  if (isRealCloudflareKey) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          },
        }
      );

      const data = await response.json();
      if (!data.success) {
        logger.warn('Cloudflare direct upload request returned error:', data.errors);
        throw new Error(data.errors?.[0]?.message || 'Failed to get Cloudflare upload URL');
      }

      return {
        uploadUrl: data.result.uploadURL,
        cloudflareImageId: data.result.id,
      };
    } catch (error) {
      logger.warn('Error generating Cloudflare direct upload URL. Falling back to development session:', error.message);
      const mockId = `mock_cf_img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        uploadUrl: `https://upload.imagedelivery.net/mock_account/${mockId}`,
        cloudflareImageId: mockId,
      };
    }
  }

  // Development / Mock fallback
  logger.warn('Cloudflare credentials omitted or placeholder. Returning mock direct upload session.');
  const mockId = `mock_cf_img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return {
    uploadUrl: `https://upload.imagedelivery.net/mock_account/${mockId}`,
    cloudflareImageId: mockId,
  };
};

/**
 * Register image metadata in PostgreSQL
 */
export const registerImageMetadata = async ({ cloudflareImageId, url, altText, width, height }) => {
  if (!cloudflareImageId || typeof cloudflareImageId !== 'string') {
    const err = new Error('Cloudflare image ID is required');
    err.statusCode = 400;
    throw err;
  }

  let deliveryUrl = url;
  if (!deliveryUrl) {
    if (env.CLOUDFLARE_ACCOUNT_HASH) {
      deliveryUrl = `https://imagedelivery.net/${env.CLOUDFLARE_ACCOUNT_HASH}/${cloudflareImageId}/public`;
    } else {
      deliveryUrl = `https://imagedelivery.net/demo_hash/${cloudflareImageId}/public`;
    }
  }

  const sql = `
    INSERT INTO images (cloudflare_image_id, url, alt_text, width, height)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (cloudflare_image_id) 
    DO UPDATE SET 
      url = EXCLUDED.url,
      alt_text = EXCLUDED.alt_text,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      updated_at = NOW()
    RETURNING id, cloudflare_image_id, url, alt_text, width, height, created_at, updated_at
  `;

  const result = await query(sql, [
    cloudflareImageId.trim(),
    deliveryUrl,
    altText ? altText.trim() : null,
    width || null,
    height || null,
  ]);

  return result.rows[0];
};

/**
 * Get image by UUID
 */
export const getImageById = async (imageId) => {
  const sql = `SELECT id, cloudflare_image_id, url, alt_text, width, height, created_at, updated_at FROM images WHERE id = $1`;
  const result = await query(sql, [imageId]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};

/**
 * List images with pagination
 */
export const listImages = async ({ page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const countSql = `SELECT COUNT(*) FROM images`;
  const countRes = await query(countSql);
  const totalItems = parseInt(countRes.rows[0].count, 10);

  const sql = `
    SELECT id, cloudflare_image_id, url, alt_text, width, height, created_at, updated_at
    FROM images
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await query(sql, [limitNum, offset]);

  return {
    images: result.rows,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

/**
 * Delete image record and purge from Cloudflare Images
 */
export const deleteImage = async (imageId) => {
  const image = await getImageById(imageId);
  if (!image) {
    const err = new Error('Image not found');
    err.statusCode = 404;
    throw err;
  }

  // If Cloudflare API credentials configured, purge from Cloudflare CDN
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN && !env.CLOUDFLARE_ACCOUNT_ID.includes('your_')) {
    try {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${image.cloudflare_image_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          },
        }
      );
      const cfData = await cfRes.json();
      if (!cfData.success) {
        logger.warn(`Failed to delete Cloudflare image ${image.cloudflare_image_id}:`, cfData.errors);
      }
    } catch (cfErr) {
      logger.error(`Error deleting image from Cloudflare API:`, cfErr);
    }
  }

  // Delete from PostgreSQL
  const deleteSql = `DELETE FROM images WHERE id = $1 RETURNING id`;
  const result = await query(deleteSql, [imageId]);
  return result.rows.length > 0;
};
