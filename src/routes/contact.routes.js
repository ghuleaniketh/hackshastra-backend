import { Router } from 'express';
import { submitContact, requestOtp, verifyOtp } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/otp', contactLimiter, requestOtp);
router.post('/verify', contactLimiter, verifyOtp);
router.post('/', contactLimiter, submitContact);

export default router;
