import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import * as registrationService from '../services/registration.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  // ===== TEMP DISABLED: Registration OTP request (commented out on 2026-09-08) =====
  // const { email, fullName, eventId } = req.body;
  // const result = await registrationService.requestRegistrationOtp({ email, fullName, eventId });
  // return ApiResponse.success(res, 'Verification OTP sent to your university email', result, 200);
  // ===== END TEMP DISABLED: Registration OTP request =====

  // Minimal stub to avoid breaking frontend calls
  return ApiResponse.success(
    res,
    'OTP verification is temporarily disabled',
    { email: req.body?.email, otpDisabled: true, verified: true },
    200
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  // ===== TEMP DISABLED: Registration OTP verification (commented out on 2026-09-08) =====
  // const { email, otp } = req.body;
  // const result = await registrationService.verifyRegistrationOtp({ email, otp });
  // return ApiResponse.success(res, 'Email verified successfully', result, 200);
  // ===== END TEMP DISABLED: Registration OTP verification =====

  // Minimal stub to avoid breaking frontend calls
  return ApiResponse.success(
    res,
    'Email verification bypassed (OTP disabled)',
    {
      email: req.body?.email,
      verified: true,
      otpDisabled: true,
      verificationProofToken: 'otp_disabled_bypassed_token',
    },
    200
  );
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
  // ===== TEMP DISABLED: Send pass email dispatch (commented out on 2026-09-08) =====
  // const { email, registrationId, fullName, eventTitle, passId, pokemonName } = req.body;
  // const reqSizeBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  // logger.info(`[POST /api/registrations/send-pass] Payload size: ${reqSizeBytes} bytes (${(reqSizeBytes / 1024).toFixed(2)} KB)`);
  // const result = await registrationService.dispatchPassEmail({
  //   email,
  //   registrationId,
  //   fullName,
  //   eventTitle,
  //   passId,
  //   pokemonName,
  // });
  // return ApiResponse.success(res, 'Trainer pass and card successfully emailed to user', result, 200);
  // ===== END TEMP DISABLED: Send pass email dispatch =====

  // Minimal stub to avoid breaking frontend calls
  return ApiResponse.success(
    res,
    'Pass email dispatch is temporarily disabled',
    { emailDisabled: true },
    200
  );
});

