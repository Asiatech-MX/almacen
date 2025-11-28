"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const web_api_cjs_1 = require("../config/web-api.cjs");
/**
 * Rate limiting middleware
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: web_api_cjs_1.config.rateLimit.windowMs,
    max: web_api_cjs_1.config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests if configured
    skip: (req, res) => {
        if (web_api_cjs_1.config.rateLimit.skipSuccessfulRequests) {
            return res.statusCode < 400;
        }
        return false;
    },
    // Custom key generator for rate limiting
    keyGenerator: (req) => {
        // Use IP address as key
        return req.ip;
    },
    // Custom skip function for certain routes
    skipSuccessfulRequests: web_api_cjs_1.config.rateLimit.skipSuccessfulRequests,
    // Custom handler for rate limit exceeded
    handler: (req, res, next, options) => {
        // Log rate limit violation
        console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        // Send JSON response
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            timestamp: new Date().toISOString(),
            retryAfter: Math.ceil(options.windowMs / 1000) // Convert to seconds
        });
    },
    // Store rate limit data in memory (for single instance)
    store: new Map(),
    // Don't rate limit in test environment
    skip: (req, res) => {
        return process.env.NODE_ENV === 'test';
    }
});
exports.default = exports.rateLimiter;
//# sourceMappingURL=rateLimiter.js.map