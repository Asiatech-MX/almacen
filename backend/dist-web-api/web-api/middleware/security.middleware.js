"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noCache = exports.httpsEnforcement = exports.securityLogger = exports.inputSanitization = exports.adminRateLimit = exports.apiRateLimit = exports.corsMiddleware = exports.applySecurity = exports.securityMiddleware = exports.SecurityMiddleware = exports.defaultSecurityConfig = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_simple_util_1 = __importDefault(require("../utils/logger-simple.util"));
exports.defaultSecurityConfig = {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 1000, // 1000 requests per window
    enableCSP: true,
    enableHSTS: process.env.NODE_ENV === 'production',
    trustProxy: true
};
/**
 * Enhanced security middleware with production-ready configurations
 */
class SecurityMiddleware {
    constructor(config = {}) {
        this.config = { ...exports.defaultSecurityConfig, ...config };
    }
    /**
     * Apply all security middlewares
     */
    apply() {
        return (req, res, next) => {
            try {
                this.applyHelmet(req, res, next);
            }
            catch (error) {
                logger_simple_util_1.default.error('❌ Security middleware error:', error);
                next(error);
            }
        };
    }
    /**
     * Apply helmet with enhanced security headers
     */
    applyHelmet(req, res, next) {
        const helmetConfig = {
            // Content Security Policy
            contentSecurityPolicy: this.config.enableCSP ? {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'", // Required for Chrome DevTools and development
                        'fonts.googleapis.com',
                        'cdn.jsdelivr.net'
                    ],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-eval'", // Required for Chrome DevTools
                        'cdnjs.cloudflare.com',
                        'cdn.jsdelivr.net'
                    ],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https:",
                        "blob:" // For Chrome DevTools screenshots
                    ],
                    connectSrc: [
                        "'self'",
                        "http://localhost:*",
                        "https://localhost:*",
                        "ws://localhost:*",
                        "wss://localhost:*"
                    ],
                    fontSrc: [
                        "'self'",
                        "fonts.gstatic.com",
                        "cdn.jsdelivr.net"
                    ],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                    childSrc: ["'none'"],
                    workerSrc: ["'self'"],
                    manifestSrc: ["'self'"],
                    upgradeInsecureRequests: this.config.enableHSTS ? [] : null
                }
            } : false,
            // HTTP Strict Transport Security
            hsts: this.config.enableHSTS ? {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            } : false,
            // Cross-Origin Embedder Policy
            crossOriginEmbedderPolicy: false, // Required for Chrome DevTools
            // Cross-Origin Opener Policy
            crossOriginOpenerPolicy: {
                policy: "same-origin"
            },
            // Cross-Origin Resource Policy
            crossOriginResourcePolicy: {
                policy: "cross-origin"
            },
            // DNS Prefetch Control
            dnsPrefetchControl: {
                allow: false
            },
            // Frame Options
            frameguard: {
                action: 'deny'
            },
            // Hide Powered-By header
            hidePoweredBy: true,
            // IE Compatibility
            ieNoOpen: true,
            // No Sniff
            noSniff: true,
            // Origin Agent Cluster
            originAgentCluster: true,
            // Permission Policy
            permissionsPolicy: {
                features: {
                    camera: ["'none'"],
                    microphone: ["'none'"],
                    geolocation: ["'none'"],
                    payment: ["'none'"],
                    usb: ["'none'"],
                    accelerometer: ["'none'"],
                    gyroscope: ["'none'"],
                    magnetometer: ["'none'"]
                }
            },
            // Referrer Policy
            referrerPolicy: {
                policy: "strict-origin-when-cross-origin"
            },
            // X-Content-Type-Options
            xContentTypeOptions: true,
            // X-DNS-Prefetch-Control
            xDnsPrefetchControl: false,
            // X-Download-Options
            xDownloadOptions: false,
            // X-Frame-Options
            xFrameOptions: 'DENY',
            // X-Permitted-Cross-Domain-Policies
            xPermittedCrossDomainPolicies: false,
            // X-XSS-Protection
            xXssProtection: '1; mode=block'
        };
        // Apply helmet middleware
        return (0, helmet_1.default)(helmetConfig)(req, res, next);
    }
    /**
     * Advanced rate limiting with different limits for different routes
     */
    rateLimit(options = {}) {
        const config = {
            windowMs: options.windowMs || this.config.rateLimitWindowMs,
            max: options.max || this.config.rateLimitMax,
            message: options.message || {
                error: 'Too many requests',
                retryAfter: Math.ceil((this.config.rateLimitWindowMs / 1000) / 60) + ' minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: options.skipSuccessfulRequests || false,
            skipFailedRequests: options.skipFailedRequests || false,
            keyGenerator: options.keyGenerator || ((req) => {
                return req.ip || req.connection.remoteAddress || 'unknown';
            })
        };
        return (0, express_rate_limit_1.default)(config);
    }
    /**
     * API-specific rate limiting (stricter limits)
     */
    apiRateLimit() {
        return this.rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 500, // Stricter limit for API endpoints
            message: {
                error: 'API rate limit exceeded',
                retryAfter: '15 minutes'
            },
            keyGenerator: (req) => {
                const ip = req.ip || req.connection.remoteAddress || 'unknown';
                const user = req.headers['x-user-id'] || 'anonymous';
                return `api:${ip}:${user}`;
            }
        });
    }
    /**
     * Admin-specific rate limiting (very strict)
     */
    adminRateLimit() {
        return this.rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Very strict for admin endpoints
            message: {
                error: 'Admin rate limit exceeded',
                retryAfter: '15 minutes'
            },
            keyGenerator: (req) => {
                const user = req.headers['x-user-id'] || 'unknown';
                const ip = req.ip || req.connection.remoteAddress || 'unknown';
                return `admin:${user}:${ip}`;
            }
        });
    }
    /**
     * CORS configuration for development and production
     */
    corsMiddleware() {
        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? [
                'https://yourdomain.com',
                'https://www.yourdomain.com'
            ]
            : [
                'http://localhost:5173', // Vite dev server
                'http://localhost:3000', // React dev server
                'http://localhost:3001', // Web API server
                'devtools://*', // Chrome DevTools
                'chrome-devtools://*', // Chrome DevTools
                null // Permitir requests sin origin (herramientas de desarrollo)
            ];
        return (req, res, next) => {
            const origin = req.headers.origin;
            // En desarrollo, ser más permisivos
            if (process.env.NODE_ENV !== 'production') {
                res.header('Access-Control-Allow-Origin', origin || '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-ID');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Count, X-Cache-Hit');
                res.header('Access-Control-Max-Age', '86400'); // 24 hours
                if (req.method === 'OPTIONS') {
                    return res.status(200).end();
                }
                return next();
            }
            // En producción, verificar origen
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-ID');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Count, X-Cache-Hit');
                res.header('Access-Control-Max-Age', '3600'); // 1 hour
                if (req.method === 'OPTIONS') {
                    return res.status(200).end();
                }
                return next();
            }
            // Origen no permitido
            res.status(403).json({
                error: 'CORS policy violation',
                message: 'Origin not allowed'
            });
        };
    }
    /**
     * Input sanitization middleware
     */
    inputSanitization() {
        return (req, res, next) => {
            try {
                // Sanitize query parameters
                if (req.query) {
                    req.query = this.sanitizeObject(req.query);
                }
                // Sanitize request body
                if (req.body) {
                    req.body = this.sanitizeObject(req.body);
                }
                // Sanitize path parameters
                if (req.params) {
                    req.params = this.sanitizeObject(req.params);
                }
                next();
            }
            catch (error) {
                logger_simple_util_1.default.warn('⚠️ Input sanitization error:', error);
                next();
            }
        };
    }
    /**
     * Request logging middleware for security monitoring
     */
    securityLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            const originalSend = res.send;
            // Log request details
            const logData = {
                method: req.method,
                url: req.originalUrl || req.url,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                timestamp: new Date(),
                userId: req.headers['x-user-id']
            };
            // Override res.send to log response
            res.send = function (data) {
                const responseTime = Date.now() - startTime;
                const statusCode = res.statusCode;
                // Log suspicious activity
                if (statusCode >= 400 || req.originalUrl?.includes('..') || req.originalUrl?.includes('<script')) {
                    logger_simple_util_1.default.warn('🚨 Suspicious request detected:', {
                        ...logData,
                        statusCode,
                        responseTime
                    });
                }
                else if (responseTime > 5000) {
                    logger_simple_util_1.default.warn('⚠️ Slow request detected:', {
                        ...logData,
                        statusCode,
                        responseTime
                    });
                }
                return originalSend.call(this, data);
            };
            next();
        };
    }
    /**
     * HTTPS enforcement in production
     */
    httpsEnforcement() {
        return (req, res, next) => {
            if (process.env.NODE_ENV === 'production' && !req.secure) {
                const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
                return res.redirect(301, httpsUrl);
            }
            next();
        };
    }
    /**
     * Disable caching for sensitive endpoints
     */
    noCache() {
        return (req, res, next) => {
            res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
            next();
        };
    }
    /**
     * Simple object sanitization
     */
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Remove potential XSS patterns
                sanitized[key] = value
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}
exports.SecurityMiddleware = SecurityMiddleware;
// Export singleton instance
exports.securityMiddleware = new SecurityMiddleware();
// Export individual middleware functions
exports.applySecurity = exports.securityMiddleware.apply();
exports.corsMiddleware = exports.securityMiddleware.corsMiddleware();
exports.apiRateLimit = exports.securityMiddleware.apiRateLimit();
exports.adminRateLimit = exports.securityMiddleware.adminRateLimit();
exports.inputSanitization = exports.securityMiddleware.inputSanitization();
exports.securityLogger = exports.securityMiddleware.securityLogger();
exports.httpsEnforcement = exports.securityMiddleware.httpsEnforcement();
exports.noCache = exports.securityMiddleware.noCache();
exports.default = exports.securityMiddleware;
//# sourceMappingURL=security.middleware.js.map