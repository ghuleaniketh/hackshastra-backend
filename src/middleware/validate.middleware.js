import ApiResponse from '../utils/apiResponse.js';

/**
 * Validate registration request body
 */
export const validateRegistrationInput = (req, res, next) => {
  const { fullName, email } = req.body || {};
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push('Full name is required');
  } else if (fullName.trim().length < 2 || fullName.trim().length > 255) {
    errors.push('Full name must be between 2 and 255 characters');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email address is required');
  } else if (!emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (errors.length > 0) {
    return ApiResponse.error(res, 'Validation failed', 400, errors);
  }

  next();
};
