import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '../../logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create logger instance
export const createLogger = () => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
      service: 'enhanced-secretbot',
      environment: process.env.NODE_ENV || 'development'
    },
    transports: [
      // Write all logs to combined.log
      new winston.transports.File({
        filename: join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        format: logFormat
      }),
      
      // Write error logs to error.log
      new winston.transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        format: logFormat
      }),
      
      // Write debug logs to debug.log
      new winston.transports.File({
        filename: join(logsDir, 'debug.log'),
        level: 'debug',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: logFormat
      })
    ],
    exceptionHandlers: [
      new winston.transports.File({
        filename: join(logsDir, 'exceptions.log'),
        format: logFormat
      })
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: join(logsDir, 'rejections.log'),
        format: logFormat
      })
    ]
  });

  // Add console transport for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: consoleFormat
    }));
  }

  // Add custom methods
  logger.success = (message, ...args) => {
    logger.info(`✅ ${message}`, ...args);
  };

  logger.warning = (message, ...args) => {
    logger.warn(`⚠️ ${message}`, ...args);
  };

  logger.command = (message, ...args) => {
    logger.info(`🔧 ${message}`, ...args);
  };

  logger.event = (message, ...args) => {
    logger.info(`📋 ${message}`, ...args);
  };

  logger.database = (message, ...args) => {
    logger.info(`🗄️ ${message}`, ...args);
  };

  logger.api = (message, ...args) => {
    logger.info(`🌐 ${message}`, ...args);
  };

  logger.security = (message, ...args) => {
    logger.warn(`🔒 ${message}`, ...args);
  };

  return logger;
};

// Export default logger instance
export default createLogger();