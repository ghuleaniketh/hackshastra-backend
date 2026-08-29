import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import env from './env.js';
import logger from '../utils/logger.js';

let firebaseApp = null;

if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      firebaseApp = getApps()[0];
    }
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  logger.warn('Firebase configuration omitted. Using development/mock authentication mode.');
}

/**
 * Verify Firebase ID Token
 * @param {string} idToken 
 * @returns {Promise<{ uid: string, email: string, name: string, picture: string }>}
 */
export const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    const err = new Error('Firebase ID token is required');
    err.statusCode = 400;
    throw err;
  }

  // Development / Mock fallback when test token is provided or Firebase is omitted
  if (idToken.startsWith('mock_google_token_') || (env.NODE_ENV === 'development' && !firebaseApp)) {
    logger.warn('Using mock token verification for development mode');
    const mockEmail = idToken.includes('@') ? idToken.replace('mock_google_token_', '') : 'admin@hackshastra.org';
    return {
      uid: `mock_uid_${Buffer.from(mockEmail).toString('hex').substring(0, 16)}`,
      email: mockEmail,
      name: mockEmail.split('@')[0],
      picture: 'https://via.placeholder.com/150',
    };
  }

  if (firebaseApp) {
    try {
      const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        picture: decodedToken.picture || null,
      };
    } catch (error) {
      logger.error('Firebase ID token verification failed:', error);
      const err = new Error('Invalid or expired Firebase authentication token');
      err.statusCode = 401;
      throw err;
    }
  }

  const err = new Error('Firebase Admin SDK is not configured on the server');
  err.statusCode = 500;
  throw err;
};

export default firebaseApp;
