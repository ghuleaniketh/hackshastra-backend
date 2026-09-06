import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as contactService from '../services/contact.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  const result = await contactService.requestContactOtp(req.body);
  return ApiResponse.success(res, 'Verification code sent to your email address.', result, 200);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await contactService.verifyContactOtp(req.body);
  return ApiResponse.success(res, 'Email successfully verified.', result, 200);
});

export const submitContact = asyncHandler(async (req, res) => {
  const contact = await contactService.submitContactRequest(req.body);
  return ApiResponse.success(res, 'Contact request submitted successfully. We will get back to you soon!', contact, 201);
});
