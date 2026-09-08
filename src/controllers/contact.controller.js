import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as contactService from '../services/contact.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  // ===== TEMP DISABLED: Contact OTP request (commented out on 2026-09-08) =====
  // const result = await contactService.requestContactOtp(req.body);
  // return ApiResponse.success(res, 'Verification code sent to your email address.', result, 200);
  // ===== END TEMP DISABLED: Contact OTP request =====

  // Minimal stub to avoid breaking frontend contact form calls
  return ApiResponse.success(
    res,
    'Contact OTP verification is temporarily disabled',
    { email: req.body?.email, otpDisabled: true, verified: true },
    200
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  // ===== TEMP DISABLED: Contact OTP verification (commented out on 2026-09-08) =====
  // const result = await contactService.verifyContactOtp(req.body);
  // return ApiResponse.success(res, 'Email successfully verified.', result, 200);
  // ===== END TEMP DISABLED: Contact OTP verification =====

  // Minimal stub to avoid breaking frontend contact form calls
  return ApiResponse.success(
    res,
    'Contact email verification bypassed (OTP disabled)',
    {
      email: req.body?.email,
      verified: true,
      otpDisabled: true,
      verificationToken: 'contact_otp_disabled_bypassed_token',
    },
    200
  );
});

export const submitContact = asyncHandler(async (req, res) => {
  const contact = await contactService.submitContactRequest(req.body);
  return ApiResponse.success(res, 'Contact request submitted successfully. We will get back to you soon!', contact, 201);
});
