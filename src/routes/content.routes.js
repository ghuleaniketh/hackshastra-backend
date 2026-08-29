import { Router } from 'express';
import { getContentByKey } from '../controllers/content.controller.js';

const router = Router();

router.get('/:key', getContentByKey);

export default router;
