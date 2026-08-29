import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token and its SHA-256 hash.
 * @returns {{ rawToken: string, tokenHash: string }}
 */
export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
};

/**
 * Hash a raw token string using SHA-256.
 * @param {string} token 
 * @returns {string} SHA-256 hex string
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
