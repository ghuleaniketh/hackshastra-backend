import express from 'express';
import ApiResponse from '../utils/apiResponse.js';

const router = express.Router();

/**
 * GET /api/health
 * Public health check endpoint
 */
router.get('/health', (req, res) => {
  return ApiResponse.success(res, 'HackShastra API is running');
});

export default router;
