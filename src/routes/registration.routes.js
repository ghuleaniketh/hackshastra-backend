import { Router } from 'express';
import { verifyToken, requestOtp, verifyOtp } from '../controllers/registration.controller.js';
import { registrationLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/otp', registrationLimiter, requestOtp);
router.post('/verify-otp', registrationLimiter, verifyOtp);
router.get('/verify/:token', verifyToken);

export default router;
