"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTransport = exports.addTransport = exports.setLogLevel = exports.getLogger = exports.createLogEntry = exports.logMetrics = exports.logFileOperation = exports.logExternalServiceCall = exports.logCacheEvent = exports.logBackgroundJob = exports.logHealthCheck = exports.logSystemEvent = exports.logApiCall = exports.logAudit = exports.logBusinessEvent = exports.logPerformance = exports.logSecurityEvent = exports.logDatabaseQuery = exports.logError = exports.requestLogger = exports.createChildLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
// Define colors for console output
const colors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    http: '\x1b[35m',
    debug: '\x1b[37m',
    reset: '\x1b[0m'
};
// Create winston logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: {
        service: 'almacen-web-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Console transport for development
        new winston_1.default.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                const color = colors[level] || colors.reset;
                const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
                return `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message} ${metaStr}`;
            }))
        }),
        // File transport for production
        ...(process.env.LOG_FILE_ENABLED === 'true' ? [
            new winston_1.default.transports.File({
                filename: process.env.LOG_FILE_PATH || './logs/app.log',
                level: process.env.LOG_LEVEL || 'info',
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
            })
        ] : [])
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: './logs/exceptions.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: './logs/rejections.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ]
});
/**
 * Create child logger with additional context
 */
const createChildLogger = (service, additionalMeta = {}) => {
    const childLogger = logger.child({
        service,
        ...additionalMeta
    });
    return {
        error: (message, meta) => childLogger.error(message, meta),
        warn: (message, meta) => childLogger.warn(message, meta),
        info: (message, meta) => childLogger.info(message, meta),
        http: (message, meta) => childLogger.http(message, meta),
        debug: (message, meta) => childLogger.debug(message, meta)
    };
};
exports.createChildLogger = createChildLogger;
/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    logger.http('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length'),
        requestId: req.id
    });
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        logger.http('HTTP Response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            contentLength: chunk ? chunk.length : 0,
            requestId: req.id
        });
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
/**
 * Error logging utility
 */
const logError = (error, context) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        context,
        name: error.name
    });
};
exports.logError = logError;
/**
 * Database logging utility
 */
const logDatabaseQuery = (query, params, duration) => {
    logger.debug('Database Query', {
        query,
        params,
        duration,
        level: 'database'
    });
};
exports.logDatabaseQuery = logDatabaseQuery;
/**
 * Security logging utility
 */
const logSecurityEvent = (event, details) => {
    logger.warn('Security Event', {
        event,
        details,
        level: 'security'
    });
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Performance logging utility
 */
const logPerformance = (operation, duration, details) => {
    logger.info('Performance Metric', {
        operation,
        duration,
        details,
        level: 'performance'
    });
};
exports.logPerformance = logPerformance;
/**
 * Business event logging utility
 */
const logBusinessEvent = (event, data, userId) => {
    logger.info('Business Event', {
        event,
        data,
        userId,
        level: 'business'
    });
};
exports.logBusinessEvent = logBusinessEvent;
/**
 * Audit logging utility
 */
const logAudit = (action, entity, entityId, userId, changes) => {
    logger.info('Audit Log', {
        action,
        entity,
        entityId,
        userId,
        changes,
        level: 'audit'
    });
};
exports.logAudit = logAudit;
/**
 * API logging utility
 */
const logApiCall = (method, endpoint, userId, duration, statusCode) => {
    logger.http('API Call', {
        method,
        endpoint,
        userId,
        duration,
        statusCode,
        level: 'api'
    });
};
exports.logApiCall = logApiCall;
/**
 * System logging utility
 */
const logSystemEvent = (event, details) => {
    logger.info('System Event', {
        event,
        details,
        level: 'system'
    });
};
exports.logSystemEvent = logSystemEvent;
/**
 * Health check logging utility
 */
const logHealthCheck = (status, details) => {
    logger.info('Health Check', {
        status,
        details,
        level: 'health'
    });
};
exports.logHealthCheck = logHealthCheck;
/**
 * Background job logging utility
 */
const logBackgroundJob = (jobName, status, details) => {
    logger.info('Background Job', {
        jobName,
        status,
        details,
        level: 'background'
    });
};
exports.logBackgroundJob = logBackgroundJob;
/**
 * Cache logging utility
 */
const logCacheEvent = (operation, key, details) => {
    logger.debug('Cache Event', {
        operation,
        key,
        details,
        level: 'cache'
    });
};
exports.logCacheEvent = logCacheEvent;
/**
 * External service logging utility
 */
const logExternalServiceCall = (service, operation, duration, status, error) => {
    logger.info('External Service Call', {
        service,
        operation,
        duration,
        status,
        error: error?.message,
        level: 'external'
    });
};
exports.logExternalServiceCall = logExternalServiceCall;
/**
 * File operation logging utility
 */
const logFileOperation = (operation, filename, details) => {
    logger.info('File Operation', {
        operation,
        filename,
        details,
        level: 'file'
    });
};
exports.logFileOperation = logFileOperation;
/**
 * Metrics logging utility
 */
const logMetrics = (metrics) => {
    logger.info('Metrics', {
        metrics,
        level: 'metrics'
    });
};
exports.logMetrics = logMetrics;
/**
 * Create structured log entry
 */
const createLogEntry = (level, message, meta = {}) => {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
    };
};
exports.createLogEntry = createLogEntry;
/**
 * Get logger instance
 */
const getLogger = () => {
    return logger;
};
exports.getLogger = getLogger;
/**
 * Set log level dynamically
 */
const setLogLevel = (level) => {
    logger.level = level;
};
exports.setLogLevel = setLogLevel;
/**
 * Add transport dynamically
 */
const addTransport = (transport) => {
    logger.add(transport);
};
exports.addTransport = addTransport;
/**
 * Remove transport dynamically
 */
const removeTransport = (transport) => {
    logger.remove(transport);
};
exports.removeTransport = removeTransport;
/**
 * Export default logger
 */
exports.default = logger;
//# sourceMappingURL=logger-simple.util.js.map