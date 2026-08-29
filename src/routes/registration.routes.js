import { Router } from 'express';
import { verifyToken } from '../controllers/registration.controller.js';

const router = Router();

router.get('/verify/:token', verifyToken);

export default router;
