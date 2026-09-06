import { Router } from 'express';
import { googleLogin, directLogin, getMe, logout } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/google', authLimiter, googleLogin);
router.post('/direct', authLimiter, directLogin);
router.get('/me', authenticateUser, getMe);
router.post('/logout', authenticateUser, logout);

export default router;
