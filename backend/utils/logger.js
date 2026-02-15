const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'cyberspace-backend' },
  transports: [
    // Console output only
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0) {
            metaStr = ` ${JSON.stringify(meta)}`;
          }
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    responseTime: `${responseTime}ms`,
    statusCode: res.statusCode,
    contentLength: res.get('Content-Length') || 0
  });
};

// Add scan logging helper
logger.logScan = (scanId, url, riskLevel, duration) => {
  logger.info('URL Scan Completed', {
    scanId,
    url,
    riskLevel,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
};

// Add error logging helper
logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

// Add security event logging
logger.logSecurityEvent = (eventType, details) => {
  logger.warn('Security Event', {
    eventType,
    ...details,
    timestamp: new Date().toISOString()
  });
};

// Add API rate limit logging
logger.logRateLimit = (ip, endpoint) => {
  logger.warn('Rate Limit Exceeded', {
    ip,
    endpoint,
    timestamp: new Date().toISOString()
  });
};

// Add threat detection logging
logger.logThreatDetected = (url, threatType, severity, details) => {
  logger.warn('Threat Detected', {
    url,
    threatType,
    severity,
    details,
    timestamp: new Date().toISOString()
  });
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  logger.end(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  logger.end(() => {
    process.exit(0);
  });
});

module.exports = logger;
