const app = require('./app');
const connectDB = require('./config/db');
const { config, validateEnv } = require('./config/env');
const { logger } = require('./config/logger');

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

// Connect to database
connectDB();

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});
