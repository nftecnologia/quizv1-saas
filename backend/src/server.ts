import app from './app';
import { testConnections } from '@/config/database';
import logger from '@/utils/logger';

const PORT = process.env.PORT || 5000;

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server starting on port ${PORT}`);
  
  try {
    // Test database connections
    const dbConnected = await testConnections();
    
    if (!dbConnected) {
      logger.error('Database connection failed, shutting down...');
      process.exit(1);
    }
    
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Version: ${process.env.API_VERSION || 'v1'}`);
    
    // Register graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
});

export default server;