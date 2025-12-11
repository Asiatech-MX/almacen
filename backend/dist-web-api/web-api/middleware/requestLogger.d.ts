import { Request, Response, NextFunction } from 'express';
/**
 * Request logging middleware
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request ID middleware
 */
export declare const requestId: (req: Request, res: Response, next: NextFunction) => void;
/**
 * User tracking middleware
 */
export declare const userTracking: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Performance monitoring middleware
 */
export declare const performanceMonitoring: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security logging middleware
 */
export declare const securityLogging: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request size monitoring middleware
 */
export declare const requestSizeMonitoring: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Response size monitoring middleware
 */
export declare const responseSizeMonitoring: (req: Request, res: Response, next: NextFunction) => void;
/**
 * API versioning middleware
 */
export declare const apiVersioning: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request context middleware
 */
export declare const requestContext: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request validation middleware
 */
export declare const requestValidation: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request sanitization middleware
 */
export declare const requestSanitization: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request timeout middleware
 */
export declare const requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request retry middleware
 */
export declare const requestRetry: (maxRetries?: number, retryDelay?: number) => (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    requestLogger: (req: Request, res: Response, next: NextFunction) => void;
    requestId: (req: Request, res: Response, next: NextFunction) => void;
    userTracking: (req: Request, res: Response, next: NextFunction) => void;
    performanceMonitoring: (req: Request, res: Response, next: NextFunction) => void;
    securityLogging: (req: Request, res: Response, next: NextFunction) => void;
    requestSizeMonitoring: (req: Request, res: Response, next: NextFunction) => void;
    responseSizeMonitoring: (req: Request, res: Response, next: NextFunction) => void;
    apiVersioning: (req: Request, res: Response, next: NextFunction) => void;
    requestContext: (req: Request, res: Response, next: NextFunction) => void;
    requestValidation: (req: Request, res: Response, next: NextFunction) => void;
    requestSanitization: (req: Request, res: Response, next: NextFunction) => void;
    requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
    requestRetry: (maxRetries?: number, retryDelay?: number) => (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=requestLogger.d.ts.map