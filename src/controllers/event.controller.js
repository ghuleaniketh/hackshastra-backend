import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as eventService from '../services/event.service.js';
import * as registrationService from '../services/registration.service.js';

export const getEvents = asyncHandler(async (req, res) => {
  const { page, limit, type, search } = req.query;
  const data = await eventService.getPublicEvents({ page, limit, type, search });
  return ApiResponse.success(res, 'Events retrieved successfully', data, 200);
});

export const getEventBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const event = await eventService.getPublicEventBySlug(slug);

  if (!event) {
    return ApiResponse.error(res, 'Event not found', 404);
  }

  return ApiResponse.success(res, 'Event details retrieved successfully', event, 200);
});

export const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const result = await registrationService.registerParticipant(eventId, req.body);

  return ApiResponse.success(
    res,
    'Registration initiated successfully. Please verify your email to complete registration.',
    {
      registration: result.registration,
      verificationUrl: result.verificationUrl,
      // In stage 5 rawToken is provided for API testing prior to Nodemailer setup in Stage 6
      verificationToken: result.rawToken,
    },
    201
  );
});
