import { Router } from 'express';
import {
  getDirectUploadUrl,
  registerImage,
  getImage,
  getImages,
  removeImage,
} from '../controllers/image.controller.js';

const router = Router();

router.post('/upload-url', getDirectUploadUrl);
router.post('/', registerImage);
router.get('/', getImages);
router.get('/:id', getImage);
router.delete('/:id', removeImage);

export default router;
