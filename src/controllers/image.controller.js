import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as imageService from '../services/image.service.js';

export const getDirectUploadUrl = asyncHandler(async (req, res) => {
  const uploadData = await imageService.createDirectUploadUrl();
  return ApiResponse.success(res, 'Direct upload URL generated successfully', uploadData, 200);
});

export const registerImage = asyncHandler(async (req, res) => {
  const { cloudflareImageId, url, altText, width, height, mimeType, fileSize } = req.body;

  const validation = imageService.validateImageMetadata({ mimeType, fileSize });
  if (!validation.isValid) {
    return ApiResponse.error(res, 'Invalid image metadata', 400, validation.errors);
  }

  const image = await imageService.registerImageMetadata({
    cloudflareImageId,
    url,
    altText,
    width,
    height,
  });

  return ApiResponse.success(res, 'Image metadata registered successfully', image, 201);
});

export const getImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const image = await imageService.getImageById(id);

  if (!image) {
    return ApiResponse.error(res, 'Image not found', 404);
  }

  return ApiResponse.success(res, 'Image details retrieved successfully', image, 200);
});

export const getImages = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await imageService.listImages({ page, limit });
  return ApiResponse.success(res, 'Images listed successfully', data, 200);
});

export const removeImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await imageService.deleteImage(id);
  return ApiResponse.success(res, 'Image deleted successfully', null, 200);
});
