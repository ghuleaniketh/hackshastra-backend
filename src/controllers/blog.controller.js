import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as blogService from '../services/blog.service.js';

export const getBlogs = asyncHandler(async (req, res) => {
  const { page, limit, tag, search } = req.query;
  const data = await blogService.getPublicBlogs({ page, limit, tag, search });
  return ApiResponse.success(res, 'Blogs retrieved successfully', data, 200);
});

export const getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const blog = await blogService.getPublicBlogBySlug(slug);

  if (!blog) {
    return ApiResponse.error(res, 'Blog post not found', 404);
  }

  return ApiResponse.success(res, 'Blog post details retrieved successfully', blog, 200);
});
