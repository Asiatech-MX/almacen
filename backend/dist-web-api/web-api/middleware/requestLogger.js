"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRetry = exports.requestTimeout = exports.requestSanitization = exports.requestValidation = exports.requestContext = exports.apiVersioning = exports.responseSizeMonitoring = exports.requestSizeMonitoring = exports.securityLogging = exports.performanceMonitoring = exports.userTracking = exports.requestId = exports.requestLogger = void 0;
const uuid_1 = require("uuid");
const web_api_cjs_1 = require("../config/web-api.cjs");
const logger_util_1 = require("../utils/logger.util");
/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    // Generate unique request ID
    req.id = (0, uuid_1.v4)();
    // Record start time
    const startTime = Date.now();
    // Log the request
    (0, logger_util_1.logApiCall)(req.method, req.url, req.user?.id, undefined, // duration will be calculated by response logger
    res.statusCode);
    // Override res.end to log response time
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - startTime;
        // Log the response
        (0, logger_util_1.logApiCall)(req.method, req.url, req.user?.id, duration, res.statusCode);
        // Call original end function
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
/**
 * Request ID middleware
 */
const requestId = (req, res, next) => {
    // Generate unique request ID if not already present
    if (!req.id) {
        req.id = (0, uuid_1.v4)();
    }
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id);
    next();
};
exports.requestId = requestId;
/**
 * User tracking middleware
 */
const userTracking = (req, res, next) => {
    // Log user information if available
    if (req.user) {
        (0, logger_util_1.logApiCall)(req.method, req.url, req.user.id, undefined, res.statusCode, {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role
        });
    }
    next();
};
exports.userTracking = userTracking;
/**
 * Performance monitoring middleware
 */
const performanceMonitoring = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = endTime - startTime;
        // Log slow requests
        if (duration[0] / 1000000 > 1000) { // 1 second threshold
            (0, logger_util_1.logApiCall)(req.method, req.url, req.user?.id, duration[0] / 1000000, res.statusCode, {
                performance: {
                    duration: duration[0] / 1000000,
                    slow: true
                }
            });
        }
    });
    next();
};
exports.performanceMonitoring = performanceMonitoring;
/**
 * Security logging middleware
 */
const securityLogging = (req, res, next) => {
    // Log suspicious requests
    const suspiciousPatterns = [
        /\.\./, // Path traversal
        /<script/i, // XSS attempts
        /union/i, // SQL injection attempts
        /drop\s+table/i, // SQL injection attempts
        /exec\s*\(/i, // Command injection attempts
        /eval\s*\(/i, // Code execution attempts
    ];
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(req.url) ||
        pattern.test(JSON.stringify(req.body)));
    if (isSuspicious) {
        (0, logger_util_1.logApiCall)(req.method, req.url, req.user?.id, undefined, 422, // Unprocessable Entity
        {
            security: {
                suspicious: true,
                patterns: suspiciousPatterns.filter(pattern => pattern.test(req.url) || pattern.test(JSON.stringify(req.body)))
            }
        });
    }
    next();
};
exports.securityLogging = securityLogging;
/**
 * Request size monitoring middleware
 */
const requestSizeMonitoring = (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    // Log large requests
    if (contentLength > 10 * 1024 * 1024) { // 10MB threshold
        (0, logger_util_1.logApiCall)(req.method, req.url, req.user?.id, undefined, res.statusCode, {
            size: {
                contentLength,
                large: true
            }
        });
    }
    next();
};
exports.requestSizeMonitoring = requestSizeMonitoring;
/**
 * Response size monitoring middleware
 */
const responseSizeMonitoring = (req, res, next) => {
    const originalSend = res.send;
    let responseSize = 0;
    res.send = function (data) {
        if (data) {
            responseSize = Buffer.byteLength(JSON.stringify(data));
        }
        // Log large responses
        if (responseSize > 5 * 1024 * 1024) { // 5MB threshold
            (0, logger_util_1.logApiCall)(req.method, req.url, req.user?.id, undefined, res.statusCode, {
                size: {
                    responseSize,
                    large: true
                }
            });
        }
        originalSend.call(this, data);
    };
    next();
};
exports.responseSizeMonitoring = responseSizeMonitoring;
/**
 * API versioning middleware
 */
const apiVersioning = (req, res, next) => {
    // Add API version to response headers
    res.setHeader('API-Version', web_api_cjs_1.config.api.version);
    res.setHeader('X-API-Version', web_api_cjs_1.config.api.version);
    next();
};
exports.apiVersioning = apiVersioning;
/**
 * Request context middleware
 */
const requestContext = (req, res, next) => {
    // Add request context
    req.context = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        origin: req.get('Origin'),
        host: req.get('Host'),
        protocol: req.protocol,
        secure: req.secure,
        xhr: req.xhr,
        contentType: req.get('Content-Type'),
        accept: req.get('Accept')
    };
    next();
};
exports.requestContext = requestContext;
/**
 * Request validation middleware
 */
const requestValidation = (req, res, next) => {
    // Validate request basics
    if (!req.method) {
        return res.status(400).json({
            success: false,
            message: 'HTTP method is required',
            timestamp: new Date().toISOString()
        });
    }
    if (!req.url) {
        return res.status(400).json({
            success: false,
            message: 'Request URL is required',
            timestamp: new Date().toISOString()
        });
    }
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(415).json({
                success: false,
                message: 'Content-Type must be application/json',
                timestamp: new Date().toISOString()
            });
        }
    }
    next();
};
exports.requestValidation = requestValidation;
/**
 * Request sanitization middleware
 */
const requestSanitization = (req, res, next) => {
    // Sanitize query parameters
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key]
                    .replace(/[<>]/g, '')
                    .replace(/['"]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+load=/gi, '')
                    .replace(/on\rror=/gi, '')
                    .replace(/on\focus=/gi, '')
                    .replace(/onblur=/gi, '')
                    .replace(/onchange=/gi, '')
                    .replace(/onsubmit=/gi, '');
            }
        }
    }
    // Sanitize request body
    if (req.body) {
        const sanitizedBody = JSON.parse(JSON.stringify(req.body));
        req.body = sanitizedBody;
    }
    next();
};
exports.requestSanitization = requestSanitization;
/**
 * Request timeout middleware
 */
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Request timeout',
                    timestamp: new Date().toISOString()
                });
            }
        }, timeoutMs);
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        next();
    };
};
exports.requestTimeout = requestTimeout;
/**
 * Request retry middleware
 */
const requestRetry = (maxRetries = 3, retryDelay = 1000) => {
    return (req, res, next) => {
        let retries = 0;
        const attemptRequest = () => {
            if (retries >= maxRetries) {
                return res.status(503).json({
                    success: false,
                    message: 'Service unavailable after retries',
                    timestamp: new Date().toISOString()
                });
            }
            // Create a new request to retry
            const retryReq = {
                ...req,
                headers: {
                    ...req.headers,
                    'X-Retry-Count': retries.toString()
                }
            };
            // Forward the request
            // This would typically be handled by a proxy or load balancer
            next(retryReq);
        };
        const retryWithDelay = () => {
            setTimeout(attemptRequest, retryDelay * (retries + 1));
        };
        // Retry with exponential backoff
        if (retries === 0) {
            attemptRequest();
        }
        else {
            retryWithDelay();
        }
        retries++;
    };
};
exports.requestRetry = requestRetry;
exports.default = {
    requestLogger: exports.requestLogger,
    requestId: exports.requestId,
    userTracking: exports.userTracking,
    performanceMonitoring: exports.performanceMonitoring,
    securityLogging: exports.securityLogging,
    requestSizeMonitoring: exports.requestSizeMonitoring,
    responseSizeMonitoring: exports.responseSizeMonitoring,
    apiVersioning: exports.apiVersioning,
    requestContext: exports.requestContext,
    requestValidation: exports.requestValidation,
    requestSanitization: exports.requestSanitization,
    requestTimeout: exports.requestTimeout,
    requestRetry: exports.requestRetry
};
//# sourceMappingURL=requestLogger.js.map