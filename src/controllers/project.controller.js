import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as projectService from '../services/project.service.js';

export const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, tech, search } = req.query;
  const data = await projectService.getPublicProjects({ page, limit, tech, search });
  return ApiResponse.success(res, 'Approved projects retrieved successfully', data, 200);
});

export const submitProject = asyncHandler(async (req, res) => {
  const project = await projectService.submitProject(req.body);
  return ApiResponse.success(
    res,
    'Project submitted successfully. It will be publicly visible after admin review.',
    project,
    201
  );
});
