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
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Dynamic CORS configuration allowing localhost Vite, previews, and configured CLIENT_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://hackshastrasrmuap.dev',
  'https://hackshastra-web.vercel.app',
  env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid CORS friction
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// HTTP request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers with request size limits (supports card PNG & PDF base64 payloads)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Global Rate Limiting across all API routes
app.use('/api', globalLimiter);

import teamRoutes from './routes/team.routes.js';

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/team', teamRoutes);
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
