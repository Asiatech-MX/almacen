"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCreditCard = exports.isValidCLABE = exports.isValidNSS = exports.isValidCURP = exports.validatePasswordStrength = exports.isValidHexColor = exports.isValidURL = exports.validateCoordinates = exports.validateFileUpload = exports.sanitizeString = exports.validateEnum = exports.validateNumberRange = exports.validateStringLength = exports.isObject = exports.isArray = exports.parseBoolean = exports.isValidBoolean = exports.isValidDate = exports.isDecimal = exports.isInteger = exports.isNonNegativeNumber = exports.isPositiveNumber = exports.isNumeric = exports.isValidPostalCode = exports.isValidRFC = exports.isValidPhone = exports.isValidEmail = exports.isValidUUID = exports.validateSorting = exports.validateSearch = exports.validatePagination = exports.runValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Utility functions for request validation
 */
/**
 * Runs validation chain and returns validation result
 */
const runValidation = (validationChain) => {
    return async (req) => {
        await Promise.all(validationChain.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }));
            return {
                isValid: false,
                errors: formattedErrors
            };
        }
        return { isValid: true };
    };
};
exports.runValidation = runValidation;
/**
 * Validates pagination parameters
 */
const validatePagination = (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};
exports.validatePagination = validatePagination;
/**
 * Validates search parameters
 */
const validateSearch = (req) => {
    const search = req.query.search;
    const fields = req.query.fields ? req.query.fields.split(',') : undefined;
    return { search: search?.trim(), fields };
};
exports.validateSearch = validateSearch;
/**
 * Validates sorting parameters
 */
const validateSorting = (req, allowedFields) => {
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder;
    // Validate sortBy field
    const validSortBy = allowedFields.includes(sortBy) ? sortBy : undefined;
    // Validate sortOrder
    const validSortOrder = ['asc', 'desc'].includes(sortOrder)
        ? sortOrder
        : 'asc';
    return { sortBy: validSortBy, sortOrder: validSortOrder };
};
exports.validateSorting = validateSorting;
/**
 * Validates UUID format
 */
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{4}-[89ab][0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
/**
 * Validates email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Validates phone number format (Mexican format)
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^(\+?52)?\s?1?\s?(\d{3})\s?(\d{3})\s?(\d{4})$/;
    return phoneRegex.test(phone);
};
exports.isValidPhone = isValidPhone;
/**
 * Validates RFC format (Mexican tax ID)
 */
const isValidRFC = (rfc) => {
    const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
    return rfcRegex.test(rfc.toUpperCase());
};
exports.isValidRFC = isValidRFC;
/**
 * Validates postal code format (Mexican)
 */
const isValidPostalCode = (postalCode) => {
    const postalCodeRegex = /^\d{5}$/;
    return postalCodeRegex.test(postalCode);
};
exports.isValidPostalCode = isValidPostalCode;
/**
 * Validates numeric string
 */
const isNumeric = (value) => {
    return /^\d+$/.test(value);
};
exports.isNumeric = isNumeric;
/**
 * Validates positive number
 */
const isPositiveNumber = (value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
};
exports.isPositiveNumber = isPositiveNumber;
/**
 * Validates non-negative number
 */
const isNonNegativeNumber = (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
};
exports.isNonNegativeNumber = isNonNegativeNumber;
/**
 * Validates integer
 */
const isInteger = (value) => {
    return Number.isInteger(Number(value));
};
exports.isInteger = isInteger;
/**
 * Validates decimal number
 */
const isDecimal = (value) => {
    const num = Number(value);
    return !isNaN(num) && num % 1 !== 0;
};
exports.isDecimal = isDecimal;
/**
 * Validates date string
 */
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
};
exports.isValidDate = isValidDate;
/**
 * Validates boolean string
 */
const isValidBoolean = (value) => {
    if (typeof value === 'boolean')
        return true;
    if (typeof value === 'string') {
        return ['true', 'false', '1', '0'].includes(value.toLowerCase());
    }
    return false;
};
exports.isValidBoolean = isValidBoolean;
/**
 * Converts boolean string to boolean
 */
const parseBoolean = (value) => {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        return ['true', '1'].includes(value.toLowerCase());
    }
    return Boolean(value);
};
exports.parseBoolean = parseBoolean;
/**
 * Validates array
 */
const isArray = (value) => {
    return Array.isArray(value);
};
exports.isArray = isArray;
/**
 * Validates object
 */
const isObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};
exports.isObject = isObject;
/**
 * Validates string length
 */
const validateStringLength = (value, minLength, maxLength) => {
    const length = value.length;
    if (minLength !== undefined && length < minLength) {
        return {
            isValid: false,
            error: `Must be at least ${minLength} characters long`
        };
    }
    if (maxLength !== undefined && length > maxLength) {
        return {
            isValid: false,
            error: `Must be no more than ${maxLength} characters long`
        };
    }
    return { isValid: true };
};
exports.validateStringLength = validateStringLength;
/**
 * Validates number range
 */
const validateNumberRange = (value, min, max) => {
    if (min !== undefined && value < min) {
        return {
            isValid: false,
            error: `Must be at least ${min}`
        };
    }
    if (max !== undefined && value > max) {
        return {
            isValid: false,
            error: `Must be no more than ${max}`
        };
    }
    return { isValid: true };
};
exports.validateNumberRange = validateNumberRange;
/**
 * Validates enum value
 */
const validateEnum = (value, allowedValues) => {
    if (!allowedValues.includes(value)) {
        return {
            isValid: false,
            error: `Must be one of: ${allowedValues.join(', ')}`
        };
    }
    return { isValid: true };
};
exports.validateEnum = validateEnum;
/**
 * Sanitizes string input
 */
const sanitizeString = (input) => {
    if (typeof input !== 'string')
        return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
};
exports.sanitizeString = sanitizeString;
/**
 * Validates file upload
 */
const validateFileUpload = (file, allowedMimeTypes, maxSize) => {
    // Check file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            isValid: false,
            error: `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
        };
    }
    // Check file size
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File size too large. Maximum size: ${maxSize} bytes`
        };
    }
    return { isValid: true };
};
exports.validateFileUpload = validateFileUpload;
/**
 * Validates coordinates
 */
const validateCoordinates = (latitude, longitude) => {
    // Validate latitude (-90 to 90)
    if (latitude < -90 || latitude > 90) {
        return {
            isValid: false,
            error: 'Latitude must be between -90 and 90'
        };
    }
    // Validate longitude (-180 to 180)
    if (longitude < -180 || longitude > 180) {
        return {
            isValid: false,
            error: 'Longitude must be between -180 and 180'
        };
    }
    return { isValid: true };
};
exports.validateCoordinates = validateCoordinates;
/**
 * Validates URL
 */
const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidURL = isValidURL;
/**
 * Validates color hex code
 */
const isValidHexColor = (color) => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i;
    return hexRegex.test(color);
};
exports.isValidHexColor = isValidHexColor;
/**
 * Validates password strength
 */
const validatePasswordStrength = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const feedback = [];
    let score = 0;
    if (requirements.minLength) {
        score += 20;
    }
    else {
        feedback.push('Password must be at least 8 characters long');
    }
    if (requirements.hasUpperCase) {
        score += 20;
    }
    else {
        feedback.push('Password must contain at least one uppercase letter');
    }
    if (requirements.hasLowerCase) {
        score += 20;
    }
    else {
        feedback.push('Password must contain at least one lowercase letter');
    }
    if (requirements.hasNumber) {
        score += 20;
    }
    else {
        feedback.push('Password must contain at least one number');
    }
    if (requirements.hasSpecialChar) {
        score += 20;
    }
    else {
        feedback.push('Password must contain at least one special character');
    }
    return {
        score,
        feedback,
        requirements
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
/**
 * Validates Mexican CURP format
 */
const isValidCURP = (curp) => {
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/i;
    return curpRegex.test(curp.toUpperCase());
};
exports.isValidCURP = isValidCURP;
/**
 * Validates Mexican NSS format
 */
const isValidNSS = (nss) => {
    const nssRegex = /^\d{10,11}$/;
    return nssRegex.test(nss);
};
exports.isValidNSS = isValidNSS;
/**
 * Validates bank account number (CLABE)
 */
const isValidCLABE = (clabe) => {
    const clabeRegex = /^\d{18}$/;
    return clabeRegex.test(clabe);
};
exports.isValidCLABE = isValidCLABE;
/**
 * Validates credit card number
 */
const isValidCreditCard = (cardNumber) => {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    // Check if all digits
    if (!/^\d+$/.test(cleaned))
        return false;
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
};
exports.isValidCreditCard = isValidCreditCard;
//# sourceMappingURL=validation.util.js.map