import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as registrationService from '../services/registration.service.js';

export const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await registrationService.verifyRegistrationToken(token);

  const message = result.alreadyVerified
    ? 'Registration has already been verified'
    : 'Registration successfully verified';

  return ApiResponse.success(res, message, result.registration, 200);
});
