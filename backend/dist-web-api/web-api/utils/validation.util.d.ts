import { Request } from 'express';
import { ValidationChain } from 'express-validator';
import { ValidationError } from '../types/api.types';
/**
 * Utility functions for request validation
 */
/**
 * Runs validation chain and returns validation result
 */
export declare const runValidation: (validationChain: ValidationChain) => (req: Request) => Promise<{
    isValid: boolean;
    errors?: ValidationError[];
}>;
/**
 * Validates pagination parameters
 */
export declare const validatePagination: (req: Request) => {
    page: number;
    limit: number;
    offset: number;
};
/**
 * Validates search parameters
 */
export declare const validateSearch: (req: Request) => {
    search?: string;
    fields?: string[];
};
/**
 * Validates sorting parameters
 */
export declare const validateSorting: (req: Request, allowedFields: string[]) => {
    sortBy?: string;
    sortOrder: "asc" | "desc";
};
/**
 * Validates UUID format
 */
export declare const isValidUUID: (uuid: string) => boolean;
/**
 * Validates email format
 */
export declare const isValidEmail: (email: string) => boolean;
/**
 * Validates phone number format (Mexican format)
 */
export declare const isValidPhone: (phone: string) => boolean;
/**
 * Validates RFC format (Mexican tax ID)
 */
export declare const isValidRFC: (rfc: string) => boolean;
/**
 * Validates postal code format (Mexican)
 */
export declare const isValidPostalCode: (postalCode: string) => boolean;
/**
 * Validates numeric string
 */
export declare const isNumeric: (value: string) => boolean;
/**
 * Validates positive number
 */
export declare const isPositiveNumber: (value: any) => boolean;
/**
 * Validates non-negative number
 */
export declare const isNonNegativeNumber: (value: any) => boolean;
/**
 * Validates integer
 */
export declare const isInteger: (value: any) => boolean;
/**
 * Validates decimal number
 */
export declare const isDecimal: (value: any) => boolean;
/**
 * Validates date string
 */
export declare const isValidDate: (dateString: string) => boolean;
/**
 * Validates boolean string
 */
export declare const isValidBoolean: (value: any) => boolean;
/**
 * Converts boolean string to boolean
 */
export declare const parseBoolean: (value: any) => boolean;
/**
 * Validates array
 */
export declare const isArray: (value: any) => boolean;
/**
 * Validates object
 */
export declare const isObject: (value: any) => boolean;
/**
 * Validates string length
 */
export declare const validateStringLength: (value: string, minLength?: number, maxLength?: number) => {
    isValid: boolean;
    error?: string;
};
/**
 * Validates number range
 */
export declare const validateNumberRange: (value: number, min?: number, max?: number) => {
    isValid: boolean;
    error?: string;
};
/**
 * Validates enum value
 */
export declare const validateEnum: <T extends string>(value: string, allowedValues: T[]) => {
    isValid: boolean;
    error?: string;
};
/**
 * Sanitizes string input
 */
export declare const sanitizeString: (input: string) => string;
/**
 * Validates file upload
 */
export declare const validateFileUpload: (file: Express.Multer.File, allowedMimeTypes: string[], maxSize: number) => {
    isValid: boolean;
    error?: string;
};
/**
 * Validates coordinates
 */
export declare const validateCoordinates: (latitude: number, longitude: number) => {
    isValid: boolean;
    error?: string;
};
/**
 * Validates URL
 */
export declare const isValidURL: (url: string) => boolean;
/**
 * Validates color hex code
 */
export declare const isValidHexColor: (color: string) => boolean;
/**
 * Validates password strength
 */
export declare const validatePasswordStrength: (password: string) => {
    score: number;
    feedback: string[];
    requirements: {
        minLength: boolean;
        hasUpperCase: boolean;
        hasLowerCase: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
    };
};
/**
 * Validates Mexican CURP format
 */
export declare const isValidCURP: (curp: string) => boolean;
/**
 * Validates Mexican NSS format
 */
export declare const isValidNSS: (nss: string) => boolean;
/**
 * Validates bank account number (CLABE)
 */
export declare const isValidCLABE: (clabe: string) => boolean;
/**
 * Validates credit card number
 */
export declare const isValidCreditCard: (cardNumber: string) => boolean;
//# sourceMappingURL=validation.util.d.ts.map