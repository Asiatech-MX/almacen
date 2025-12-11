"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const web_api_cjs_1 = require("../config/web-api.cjs");
/**
 * CORS middleware configuration
 */
exports.corsMiddleware = (0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if origin is in allowed list
        if (web_api_cjs_1.config.cors.origin.includes(origin)) {
            return callback(null, true);
        }
        // Allow localhost in development
        if (web_api_cjs_1.config.nodeEnv === 'development' && origin.includes('localhost')) {
            return callback(null, true);
        }
        // Allow subdomains in production
        if (web_api_cjs_1.config.nodeEnv === 'production') {
            const allowedOrigins = web_api_cjs_1.config.cors.origin;
            const isAllowed = allowedOrigins.some(allowedOrigin => {
                if (allowedOrigin === '*')
                    return true;
                if (allowedOrigin.includes('*')) {
                    const domain = allowedOrigin.replace('*', '');
                    return origin.endsWith(domain);
                }
                return origin === allowedOrigin;
            });
            if (isAllowed) {
                return callback(null, true);
            }
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: web_api_cjs_1.config.cors.credentials,
    methods: [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS',
        'PATCH',
        'HEAD'
    ],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-User-ID',
        'X-Request-ID',
        'X-Forwarded-For',
        'X-Forwarded-Proto',
        'X-Forwarded-Host',
        'X-Real-IP',
        'X-Client-Version',
        'X-Device-ID',
        'X-Platform',
        'X-App-Version'
    ],
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
        'X-Per-Page',
        'X-Has-Next',
        'X-Has-Prev',
        'X-Request-ID',
        'X-Response-Time',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
    // Handle preflight requests
    preflight: (req, res, next) => {
        res.header('Access-Control-Max-Age', '86400');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
        res.header('Access-Control-Allow-Credentials', web_api_cjs_1.config.cors.credentials.toString());
        if (req.method === 'OPTIONS') {
            res.sendStatus(204);
        }
        else {
            next();
        }
    }
});
exports.default = exports.corsMiddleware;
//# sourceMappingURL=cors.js.map