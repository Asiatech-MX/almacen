"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.createErrorResponse = exports.asyncHandler = exports.errorHandler = exports.RateLimitError = exports.FileUploadError = exports.ExternalServiceError = exports.DatabaseError = exports.ServiceUnavailableError = exports.TooManyRequestsError = exports.UnprocessableEntityError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.ApiError = void 0;
const web_api_cjs_1 = require("../config/web-api.cjs");
const logger_util_1 = require("../utils/logger.util");
/**
 * Error handling middleware
 */
/**
 * Custom error class
 */
class ApiError extends Error {
    constructor(message, statusCode = 500, code, details, isOperational = false) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = isOperational;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
/**
 * Validation error class
 */
class ValidationError extends ApiError {
    constructor(message, errors) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication error class
 */
class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization error class
 */
class AuthorizationError extends ApiError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Not found error class
 */
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error class
 */
class ConflictError extends ApiError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Unprocessable entity error class
 */
class UnprocessableEntityError extends ApiError {
    constructor(message = 'Unprocessable entity') {
        super(message, 422, 'UNPROCESSABLE_ENTITY');
        this.name = 'UnprocessableEntityError';
    }
}
exports.UnprocessableEntityError = UnprocessableEntityError;
/**
 * Too many requests error class
 */
class TooManyRequestsError extends ApiError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'TOO_MANY_REQUESTS');
        this.name = 'TooManyRequestsError';
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
/**
 * Service unavailable error class
 */
class ServiceUnavailableError extends ApiError {
    constructor(message = 'Service unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE');
        this.name = 'ServiceUnavailableError';
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Database error class
 */
class DatabaseError extends ApiError {
    constructor(message, details) {
        super(message, 500, 'DATABASE_ERROR', details);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * External service error class
 */
class ExternalServiceError extends ApiError {
    constructor(message, service, statusCode = 502) {
        super(message, statusCode, 'EXTERNAL_SERVICE_ERROR');
        this.name = 'ExternalServiceError';
        this.details = { service };
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * File upload error class
 */
class FileUploadError extends ApiError {
    constructor(message, details) {
        super(message, 400, 'FILE_UPLOAD_ERROR', details);
        this.name = 'FileUploadError';
    }
}
exports.FileUploadError = FileUploadError;
/**
 * Rate limit error class
 */
class RateLimitError extends ApiError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Main error handler middleware
 */
const errorHandler = (error, req, res, next) => {
    // Log the error
    (0, logger_util_1.logError)(error, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers
    });
    // Handle different types of errors
    if (error instanceof ValidationError) {
        handleValidationError(error, res);
    }
    else if (error instanceof AuthenticationError) {
        handleAuthenticationError(error, res);
    }
    else if (error instanceof AuthorizationError) {
        handleAuthorizationError(error, res);
    }
    else if (error instanceof NotFoundError) {
        handleNotFoundError(error, res);
    }
    else if (error instanceof ConflictError) {
        handleConflictError(error, res);
    }
    else if (error instanceof UnprocessableEntityError) {
        handleUnprocessableEntityError(error, res);
    }
    else if (error instanceof TooManyRequestsError) {
        handleTooManyRequestsError(error, res);
    }
    else if (error instanceof ServiceUnavailableError) {
        handleServiceUnavailableError(error, res);
    }
    else if (error instanceof DatabaseError) {
        handleDatabaseError(error, res);
    }
    else if (error instanceof ExternalServiceError) {
        handleExternalServiceError(error, res);
    }
    else if (error instanceof FileUploadError) {
        handleFileUploadError(error, res);
    }
    else if (error instanceof RateLimitError) {
        handleRateLimitError(error, res);
    }
    else if (error instanceof ApiError) {
        handleApiError(error, res);
    }
    else {
        handleGenericError(error, res);
    }
};
exports.errorHandler = errorHandler;
/**
 * Handle validation errors
 */
const handleValidationError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        errors: error.errors,
        timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
};
/**
 * Handle authentication errors
 */
const handleAuthenticationError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
};
/**
 * Handle authorization errors
 */
const handleAuthorizationError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(403).json(response);
};
/**
 * Handle not found errors
 */
const handleNotFoundError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(404).json(response);
};
/**
 * Handle conflict errors
 */
const handleConflictError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(409).json(response);
};
/**
 * Handle unprocessable entity errors
 */
const handleUnprocessableEntityError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(422).json(response);
};
/**
 * Handle too many requests errors
 */
const handleTooManyRequestsError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(429).json(response);
};
/**
 * Handle service unavailable errors
 */
const handleServiceUnavailableError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(503).json(response);
};
/**
 * Handle database errors
 */
const handleDatabaseError = (error, res) => {
    const response = {
        success: false,
        message: web_api_cjs_1.config.nodeEnv === 'production'
            ? 'Database operation failed'
            : error.message,
        code: error.code,
        details: web_api_cjs_1.config.nodeEnv === 'production' ? undefined : error.details,
        timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
};
/**
 * Handle external service errors
 */
const handleExternalServiceError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
    };
    res.status(error.statusCode).json(response);
};
/**
 * Handle file upload errors
 */
const handleFileUploadError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
};
/**
 * Handle rate limit errors
 */
const handleRateLimitError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
    };
    res.status(429).json(response);
};
/**
 * Handle API errors
 */
const handleApiError = (error, res) => {
    const response = {
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
    };
    res.status(error.statusCode).json(response);
};
/**
 * Handle generic errors
 */
const handleGenericError = (error, res) => {
    const response = {
        success: false,
        message: web_api_cjs_1.config.nodeEnv === 'production'
            ? 'Internal server error'
            : error.message,
        timestamp: new Date().toISOString()
    };
    // Include stack trace in development
    if (web_api_cjs_1.config.nodeEnv === 'development') {
        response.stack = error.stack;
    }
    res.status(500).json(response);
};
/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Create error response
 */
const createErrorResponse = (message, statusCode = 500, code, details) => {
    return {
        success: false,
        message,
        code,
        details,
        timestamp: new Date().toISOString()
    };
};
exports.createErrorResponse = createErrorResponse;
/**
 * Send error response
 */
const sendErrorResponse = (res, message, statusCode = 500, code, details) => {
    const response = (0, exports.createErrorResponse)(message, statusCode, code, details);
    res.status(statusCode).json(response);
};
exports.sendErrorResponse = sendErrorResponse;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorHandler.js.map