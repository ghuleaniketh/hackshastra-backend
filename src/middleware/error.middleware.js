import env from '../config/env.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Centralized global error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  logger.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const errors = env.NODE_ENV === 'development' ? { stack: err.stack } : null;

  return ApiResponse.error(res, message, statusCode, errors);
};

export default errorMiddleware;
