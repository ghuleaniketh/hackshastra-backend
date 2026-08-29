import { Router } from 'express';
import { getProjects, submitProject } from '../controllers/project.controller.js';
import { projectSubmissionLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/', getProjects);
router.post('/', projectSubmissionLimiter, submitProject);

export default router;
