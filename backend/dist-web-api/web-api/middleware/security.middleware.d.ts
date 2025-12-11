import { Request, Response, NextFunction } from 'express';
export interface SecurityConfig {
    rateLimitWindowMs: number;
    rateLimitMax: number;
    enableCSP: boolean;
    enableHSTS: boolean;
    trustProxy: boolean;
}
export declare const defaultSecurityConfig: SecurityConfig;
/**
 * Enhanced security middleware with production-ready configurations
 */
export declare class SecurityMiddleware {
    private config;
    constructor(config?: Partial<SecurityConfig>);
    /**
     * Apply all security middlewares
     */
    apply(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Apply helmet with enhanced security headers
     */
    private applyHelmet;
    /**
     * Advanced rate limiting with different limits for different routes
     */
    rateLimit(options?: {
        windowMs?: number;
        max?: number;
        message?: string;
        skipSuccessfulRequests?: boolean;
        skipFailedRequests?: boolean;
        keyGenerator?: (req: Request) => string;
    }): import("express-rate-limit").RateLimitRequestHandler;
    /**
     * API-specific rate limiting (stricter limits)
     */
    apiRateLimit(): import("express-rate-limit").RateLimitRequestHandler;
    /**
     * Admin-specific rate limiting (very strict)
     */
    adminRateLimit(): import("express-rate-limit").RateLimitRequestHandler;
    /**
     * CORS configuration for development and production
     */
    corsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Input sanitization middleware
     */
    inputSanitization(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Request logging middleware for security monitoring
     */
    securityLogger(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * HTTPS enforcement in production
     */
    httpsEnforcement(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Disable caching for sensitive endpoints
     */
    noCache(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Simple object sanitization
     */
    private sanitizeObject;
}
export declare const securityMiddleware: SecurityMiddleware;
export declare const applySecurity: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const apiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const inputSanitization: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLogger: (req: Request, res: Response, next: NextFunction) => void;
export declare const httpsEnforcement: (req: Request, res: Response, next: NextFunction) => void;
export declare const noCache: (req: Request, res: Response, next: NextFunction) => void;
export default securityMiddleware;
//# sourceMappingURL=security.middleware.d.ts.map