import ApiResponse from '../utils/apiResponse.js';
import { verifyToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware to verify JWT session token
 */
export const authenticateUser = (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return ApiResponse.error(res, 'Authentication token missing. Please sign in.', 401);
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('JWT Token Verification Failed:', error.message);
    return ApiResponse.error(res, 'Invalid or expired session token. Please sign in again.', 401);
  }
};

/**
 * Role-Based Authorization Middleware Generator
 * @param  {...string} allowedRoles 
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(res, `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`, 403);
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireMember = requireRole('ADMIN', 'MEMBER');
