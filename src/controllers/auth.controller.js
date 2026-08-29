import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';

export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body || {};

  if (!idToken || typeof idToken !== 'string') {
    return ApiResponse.error(res, 'Firebase ID token is required in request body', 400);
  }

  const authData = await authService.googleLogin(idToken);

  return ApiResponse.success(res, 'Authentication successful', authData, 200);
});

export const getMe = asyncHandler(async (req, res) => {
  const userProfile = await authService.getUserProfile(req.user.id);

  if (!userProfile) {
    return ApiResponse.error(res, 'User profile not found', 404);
  }

  return ApiResponse.success(res, 'User profile retrieved successfully', userProfile, 200);
});

export const logout = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 'Successfully logged out', null, 200);
});
