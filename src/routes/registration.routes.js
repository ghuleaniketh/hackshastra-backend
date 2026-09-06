import { Router } from 'express';
import { verifyToken, requestOtp, verifyOtp, sendCardEmail } from '../controllers/registration.controller.js';
import { registrationLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/otp', registrationLimiter, requestOtp);
router.post('/verify-otp', registrationLimiter, verifyOtp);
router.post('/send-pass', registrationLimiter, sendCardEmail);
router.get('/verify/:token', verifyToken);

export default router;

