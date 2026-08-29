import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as contactService from '../services/contact.service.js';

export const submitContact = asyncHandler(async (req, res) => {
  const contact = await contactService.submitContactRequest(req.body);
  return ApiResponse.success(res, 'Contact request submitted successfully. We will get back to you soon!', contact, 201);
});
