import { Router } from 'express';
import { getEvents, getEventBySlug, registerForEvent } from '../controllers/event.controller.js';
import { validateRegistrationInput } from '../middleware/validate.middleware.js';
import { registrationLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:slug', getEventBySlug);
router.post('/:eventId/register', registrationLimiter, validateRegistrationInput, registerForEvent);

export default router;
