import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate JWT session token
 * @param {object} payload 
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verify JWT session token
 * @param {string} token 
 * @returns {object} decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
