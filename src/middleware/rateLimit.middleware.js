import rateLimit from 'express-rate-limit';
import ApiResponse from '../utils/apiResponse.js';

/**
 * Standard handler for rate limit exceeded responses
 */
const rateLimitHandler = (req, res, next, options) => {
  return ApiResponse.error(
    res,
    options.message || 'Too many requests from this IP, please try again later.',
    429
  );
};

/**
 * Global rate limiter applied across all API endpoints
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for event registration
 * 10 registration requests per 15 minutes per IP
 */
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many registration requests. Please wait a few minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for contact form submissions
 * 5 contact submissions per 15 minutes per IP
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many contact form submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for community project submissions
 * 5 project submissions per 15 minutes per IP
 */
export const projectSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many project submission requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter for Google OAuth authentication
 * 10 authentication requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
