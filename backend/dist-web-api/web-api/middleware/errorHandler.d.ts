import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api.types';
/**
 * Error handling middleware
 */
/**
 * Custom error class
 */
export declare class ApiError extends Error {
    statusCode: number;
    code?: string;
    details?: any;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, details?: any, isOperational?: boolean);
}
/**
 * Validation error class
 */
export declare class ValidationError extends ApiError {
    errors: any[];
    constructor(message: string, errors: any[]);
}
/**
 * Authentication error class
 */
export declare class AuthenticationError extends ApiError {
    constructor(message?: string);
}
/**
 * Authorization error class
 */
export declare class AuthorizationError extends ApiError {
    constructor(message?: string);
}
/**
 * Not found error class
 */
export declare class NotFoundError extends ApiError {
    constructor(message?: string);
}
/**
 * Conflict error class
 */
export declare class ConflictError extends ApiError {
    constructor(message?: string);
}
/**
 * Unprocessable entity error class
 */
export declare class UnprocessableEntityError extends ApiError {
    constructor(message?: string);
}
/**
 * Too many requests error class
 */
export declare class TooManyRequestsError extends ApiError {
    constructor(message?: string);
}
/**
 * Service unavailable error class
 */
export declare class ServiceUnavailableError extends ApiError {
    constructor(message?: string);
}
/**
 * Database error class
 */
export declare class DatabaseError extends ApiError {
    constructor(message: string, details?: any);
}
/**
 * External service error class
 */
export declare class ExternalServiceError extends ApiError {
    constructor(message: string, service?: string, statusCode?: number);
}
/**
 * File upload error class
 */
export declare class FileUploadError extends ApiError {
    constructor(message: string, details?: any);
}
/**
 * Rate limit error class
 */
export declare class RateLimitError extends ApiError {
    constructor(message?: string);
}
/**
 * Main error handler middleware
 */
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Async error wrapper
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create error response
 */
export declare const createErrorResponse: (message: string, statusCode?: number, code?: string, details?: any) => ApiResponse<null>;
/**
 * Send error response
 */
export declare const sendErrorResponse: (res: Response, message: string, statusCode?: number, code?: string, details?: any) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map