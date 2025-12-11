import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationInfo } from '../types/api.types';
/**
 * Utility functions for creating consistent API responses
 */
/**
 * Creates a successful response
 */
export declare const createSuccessResponse: <T>(data: T, message?: string, statusCode?: number) => Omit<ApiResponse<T>, "timestamp">;
/**
 * Creates a paginated response
 */
export declare const createPaginatedResponse: <T>(data: T[], pagination: PaginationInfo, message?: string) => Omit<PaginatedResponse<T>, "timestamp">;
/**
 * Creates an error response
 */
export declare const createErrorResponse: (message: string, statusCode?: number, errors?: any[]) => Omit<ApiResponse<null>, "timestamp">;
/**
 * Sends a successful response
 */
export declare const sendSuccessResponse: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response;
/**
 * Sends a paginated response
 */
export declare const sendPaginatedResponse: <T>(res: Response, data: T[], pagination: PaginationInfo, message?: string) => Response;
/**
 * Sends an error response
 */
export declare const sendErrorResponse: (res: Response, message: string, statusCode?: number, errors?: any[]) => Response;
/**
 * Creates pagination metadata
 */
export declare const createPaginationInfo: (page: number, limit: number, total: number) => PaginationInfo;
/**
 * Validates pagination parameters
 */
export declare const validatePaginationParams: (page?: number, limit?: number) => {
    page: number;
    limit: number;
};
/**
 * Calculates offset for database queries
 */
export declare const calculateOffset: (page: number, limit: number) => number;
/**
 * Formats database results for API response
 */
export declare const formatDatabaseResults: <T>(results: any[], total?: number, page?: number, limit?: number) => {
    data: T[];
    pagination?: PaginationInfo;
};
/**
 * Handles async route errors
 */
export declare const handleAsyncRoute: (fn: (req: any, res: any, next?: any) => Promise<any>) => (req: any, res: any, next: any) => void;
/**
 * Validates required fields
 */
export declare const validateRequiredFields: (data: any, requiredFields: string[]) => {
    isValid: boolean;
    missingFields: string[];
};
/**
 * Sanitizes string input
 */
export declare const sanitizeString: (input: string) => string;
/**
 * Validates email format
 */
export declare const isValidEmail: (email: string) => boolean;
/**
 * Validates UUID format
 */
export declare const isValidUUID: (uuid: string) => boolean;
/**
 * Formats date for API response
 */
export declare const formatDate: (date: Date | string) => string;
/**
 * Calculates age in days from a date
 */
export declare const calculateAgeInDays: (date: Date | string) => number;
/**
 * Generates a unique request ID
 */
export declare const generateRequestId: () => string;
/**
 * Masks sensitive information in logs
 */
export declare const maskSensitiveData: (obj: any) => any;
/**
 * Converts snake_case to camelCase
 */
export declare const snakeToCamel: (str: string) => string;
/**
 * Converts camelCase to snake_case
 */
export declare const camelToSnake: (str: string) => string;
/**
 * Deep converts object keys from snake_case to camelCase
 */
export declare const convertKeysToCamelCase: (obj: any) => any;
/**
 * Deep converts object keys from camelCase to snake_case
 */
export declare const convertKeysToSnakeCase: (obj: any) => any;
//# sourceMappingURL=response.util.d.ts.map