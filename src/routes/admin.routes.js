import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  getAdminEventRegistrations,
  getAdminBlogs,
  createAdminBlog,
  updateAdminBlog,
  deleteAdminBlog,
  getAdminProjects,
  updateAdminProject,
  deleteAdminProject,
  getAdminContactRequests,
  updateAdminContactStatus,
  getAdminSiteContents,
  getAdminSiteContentByKey,
  updateAdminSiteContent,
} from '../controllers/admin.controller.js';

const router = Router();

// Protect ALL admin routes with Authentication & ADMIN Role Authorization
router.use(authenticateUser, requireAdmin);

// Event Management
router.get('/events', getAdminEvents);
router.post('/events', createAdminEvent);
router.put('/events/:id', updateAdminEvent);
router.delete('/events/:id', deleteAdminEvent);
router.get('/events/:id/registrations', getAdminEventRegistrations);

// Blog Management
router.get('/blogs', getAdminBlogs);
router.post('/blogs', createAdminBlog);
router.put('/blogs/:id', updateAdminBlog);
router.delete('/blogs/:id', deleteAdminBlog);

// Project Moderation
router.get('/projects', getAdminProjects);
router.put('/projects/:id', updateAdminProject);
router.delete('/projects/:id', deleteAdminProject);

// Contact Requests
router.get('/contact', getAdminContactRequests);
router.put('/contact/:id', updateAdminContactStatus);

// No-Code Site Content Management
router.get('/content', getAdminSiteContents);
router.get('/content/:key', getAdminSiteContentByKey);
router.put('/content/:key', updateAdminSiteContent);

export default router;
