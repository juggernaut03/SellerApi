const app = require('./app');
const connectDB = require('./config/db');
const { config, validateEnv } = require('./config/env');
const { logger } = require('./config/logger');
const https = require('https');
const http = require('http');

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

  // Self-ping mechanism to keep Render server alive
  const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

  logger.info(`🔄 Keep-alive pings enabled - pinging every ${KEEP_ALIVE_INTERVAL / (60 * 1000)} minutes`);

  const pingServer = () => {
    const protocol = APP_URL.startsWith('https') ? https : http;
    const url = new URL('/health', APP_URL);

    const req = protocol.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: 5000, // 5 second timeout
    }, (res) => {
      if (res.statusCode === 200) {
        logger.info(`✅ [KeepAlive] Self-ping successful at ${new Date().toLocaleTimeString()}`);
      } else {
        logger.warn(`⚠️ [KeepAlive] Self-ping returned status ${res.statusCode}`);
      }
    });

    req.on('error', (err) => {
      logger.error(`❌ [KeepAlive] Self-ping failed: ${err.message}`);
    });

    req.on('timeout', () => {
      logger.warn(`⏰ [KeepAlive] Self-ping timeout`);
      req.destroy();
    });

    req.end();
  };

  // Start the keep-alive pings
  setInterval(pingServer, KEEP_ALIVE_INTERVAL);

  // Ping immediately once
  setTimeout(pingServer, 1000);
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
