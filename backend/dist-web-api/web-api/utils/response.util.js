"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertKeysToSnakeCase = exports.convertKeysToCamelCase = exports.camelToSnake = exports.snakeToCamel = exports.maskSensitiveData = exports.generateRequestId = exports.calculateAgeInDays = exports.formatDate = exports.isValidUUID = exports.isValidEmail = exports.sanitizeString = exports.validateRequiredFields = exports.handleAsyncRoute = exports.formatDatabaseResults = exports.calculateOffset = exports.validatePaginationParams = exports.createPaginationInfo = exports.sendErrorResponse = exports.sendPaginatedResponse = exports.sendSuccessResponse = exports.createErrorResponse = exports.createPaginatedResponse = exports.createSuccessResponse = void 0;
/**
 * Utility functions for creating consistent API responses
 */
/**
 * Creates a successful response
 */
const createSuccessResponse = (data, message, statusCode = 200) => ({
    success: true,
    data,
    message,
    statusCode
});
exports.createSuccessResponse = createSuccessResponse;
/**
 * Creates a paginated response
 */
const createPaginatedResponse = (data, pagination, message) => ({
    success: true,
    data,
    pagination,
    message
});
exports.createPaginatedResponse = createPaginatedResponse;
/**
 * Creates an error response
 */
const createErrorResponse = (message, statusCode = 500, errors) => ({
    success: false,
    message,
    errors,
    statusCode
});
exports.createErrorResponse = createErrorResponse;
/**
 * Sends a successful response
 */
const sendSuccessResponse = (res, data, message, statusCode = 200) => {
    const response = {
        ...(0, exports.createSuccessResponse)(data, message, statusCode),
        timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccessResponse = sendSuccessResponse;
/**
 * Sends a paginated response
 */
const sendPaginatedResponse = (res, data, pagination, message) => {
    const response = {
        ...(0, exports.createPaginatedResponse)(data, pagination, message),
        timestamp: new Date().toISOString()
    };
    return res.status(200).json(response);
};
exports.sendPaginatedResponse = sendPaginatedResponse;
/**
 * Sends an error response
 */
const sendErrorResponse = (res, message, statusCode = 500, errors) => {
    const response = {
        ...(0, exports.createErrorResponse)(message, statusCode, errors),
        timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
};
exports.sendErrorResponse = sendErrorResponse;
/**
 * Creates pagination metadata
 */
const createPaginationInfo = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};
exports.createPaginationInfo = createPaginationInfo;
/**
 * Validates pagination parameters
 */
const validatePaginationParams = (page, limit) => {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(1000, Math.max(1, limit || 50));
    return {
        page: validPage,
        limit: validLimit
    };
};
exports.validatePaginationParams = validatePaginationParams;
/**
 * Calculates offset for database queries
 */
const calculateOffset = (page, limit) => {
    return (page - 1) * limit;
};
exports.calculateOffset = calculateOffset;
/**
 * Formats database results for API response
 */
const formatDatabaseResults = (results, total, page, limit) => {
    const formattedData = results.map(item => ({
        ...item,
        // Convert snake_case to camelCase if needed
        ...(item.created_at && { createdAt: item.created_at }),
        ...(item.updated_at && { updatedAt: item.updated_at }),
        ...(item.deleted_at && { deletedAt: item.deleted_at })
    }));
    if (total !== undefined && page !== undefined && limit !== undefined) {
        const pagination = (0, exports.createPaginationInfo)(page, limit, total);
        return { data: formattedData, pagination };
    }
    return { data: formattedData };
};
exports.formatDatabaseResults = formatDatabaseResults;
/**
 * Handles async route errors
 */
const handleAsyncRoute = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.handleAsyncRoute = handleAsyncRoute;
/**
 * Validates required fields
 */
const validateRequiredFields = (data, requiredFields) => {
    const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null || data[field] === '');
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
};
exports.validateRequiredFields = validateRequiredFields;
/**
 * Sanitizes string input
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string')
        return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, ''); // Remove quotes
};
exports.sanitizeString = sanitizeString;
/**
 * Validates email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Validates UUID format
 */
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
/**
 * Formats date for API response
 */
const formatDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
};
exports.formatDate = formatDate;
/**
 * Calculates age in days from a date
 */
const calculateAgeInDays = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
exports.calculateAgeInDays = calculateAgeInDays;
/**
 * Generates a unique request ID
 */
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
exports.generateRequestId = generateRequestId;
/**
 * Masks sensitive information in logs
 */
const maskSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard'];
    const masked = { ...obj };
    for (const key in masked) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            masked[key] = '***MASKED***';
        }
        else if (typeof masked[key] === 'object' && masked[key] !== null) {
            masked[key] = (0, exports.maskSensitiveData)(masked[key]);
        }
    }
    return masked;
};
exports.maskSensitiveData = maskSensitiveData;
/**
 * Converts snake_case to camelCase
 */
const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
exports.snakeToCamel = snakeToCamel;
/**
 * Converts camelCase to snake_case
 */
const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};
exports.camelToSnake = camelToSnake;
/**
 * Deep converts object keys from snake_case to camelCase
 */
const convertKeysToCamelCase = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => (0, exports.convertKeysToCamelCase)(item));
    }
    const converted = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const camelKey = (0, exports.snakeToCamel)(key);
            converted[camelKey] = (0, exports.convertKeysToCamelCase)(obj[key]);
        }
    }
    return converted;
};
exports.convertKeysToCamelCase = convertKeysToCamelCase;
/**
 * Deep converts object keys from camelCase to snake_case
 */
const convertKeysToSnakeCase = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => (0, exports.convertKeysToSnakeCase)(item));
    }
    const converted = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const snakeKey = (0, exports.camelToSnake)(key);
            converted[snakeKey] = (0, exports.convertKeysToSnakeCase)(obj[key]);
        }
    }
    return converted;
};
exports.convertKeysToSnakeCase = convertKeysToSnakeCase;
//# sourceMappingURL=response.util.js.map