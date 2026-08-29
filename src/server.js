import env from './config/env.js';
import logger from './utils/logger.js';
import app from './app.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`HackShastra API server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful Shutdown Handler
const shutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});
