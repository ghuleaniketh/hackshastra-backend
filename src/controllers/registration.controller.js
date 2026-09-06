import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as registrationService from '../services/registration.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  const { email, fullName, eventId } = req.body;
  const result = await registrationService.requestRegistrationOtp({ email, fullName, eventId });
  return ApiResponse.success(res, 'Verification OTP sent to your university email', result, 200);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await registrationService.verifyRegistrationOtp({ email, otp });
  return ApiResponse.success(res, 'Email verified successfully', result, 200);
});

export const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await registrationService.verifyRegistrationToken(token);

  const message = result.alreadyVerified
    ? 'Registration has already been verified'
    : 'Registration successfully verified';

  return ApiResponse.success(res, message, result.registration, 200);
});

export const sendCardEmail = asyncHandler(async (req, res) => {
  const { email, fullName, eventTitle, passId, pokemonName, imageDataUrl, pdfDataUrl } = req.body;
  const result = await registrationService.dispatchPassEmail({
    email,
    fullName,
    eventTitle,
    passId,
    pokemonName,
    imageDataUrl,
    pdfDataUrl,
  });

  return ApiResponse.success(res, 'Trainer pass and card successfully emailed to user', result, 200);
});

