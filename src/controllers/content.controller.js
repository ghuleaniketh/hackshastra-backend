import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as contentService from '../services/content.service.js';

export const getContentByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const content = await contentService.getPublicSiteContentByKey(key);

  if (!content) {
    return ApiResponse.error(res, 'Content section not found', 404);
  }

  return ApiResponse.success(res, 'Site content section retrieved successfully', content, 200);
});
