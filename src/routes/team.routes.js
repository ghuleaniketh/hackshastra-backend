import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { getTeamRoster } from '../services/adminTeam.service.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const team = await getTeamRoster();
  return ApiResponse.success(res, 'Public team roster retrieved successfully', team, 200);
}));

export default router;
