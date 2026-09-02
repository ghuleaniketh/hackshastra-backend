import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import eventRoutes from './routes/event.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import imageRoutes from './routes/image.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import blogRoutes from './routes/blog.routes.js';
import projectRoutes from './routes/project.routes.js';
import contactRoutes from './routes/contact.routes.js';
import contentRoutes from './routes/content.routes.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import errorMiddleware from './middleware/error.middleware.js';
import ApiResponse from './utils/apiResponse.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration with client origin restriction
app.use(
  cors({
    origin: env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// HTTP request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers with request size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global Rate Limiting across all API routes
app.use('/api', globalLimiter);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);

// 404 Handler for unknown routes
app.use((req, res, next) => {
  return ApiResponse.error(res, `Route ${req.originalUrl} not found`, 404);
});

// Centralized Global Error Handler
app.use(errorMiddleware);

export default app;
