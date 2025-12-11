import winston from 'winston';
declare const logger: winston.Logger;
/**
 * Logger interface with typed methods
 */
export interface Logger {
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    http: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
}
/**
 * Create child logger with additional context
 */
export declare const createChildLogger: (service: string, additionalMeta?: any) => Logger;
/**
 * Request logging middleware
 */
export declare const requestLogger: (req: any, res: any, next: any) => void;
/**
 * Error logging utility
 */
export declare const logError: (error: Error, context?: any) => void;
/**
 * Database logging utility
 */
export declare const logDatabaseQuery: (query: string, params: any[], duration?: number) => void;
/**
 * Security logging utility
 */
export declare const logSecurityEvent: (event: string, details: any) => void;
/**
 * Performance logging utility
 */
export declare const logPerformance: (operation: string, duration: number, details?: any) => void;
/**
 * Business event logging utility
 */
export declare const logBusinessEvent: (event: string, data: any, userId?: string) => void;
/**
 * Audit logging utility
 */
export declare const logAudit: (action: string, entity: string, entityId: string, userId?: string, changes?: any) => void;
/**
 * API logging utility
 */
export declare const logApiCall: (method: string, endpoint: string, userId?: string, duration?: number, statusCode?: number) => void;
/**
 * System logging utility
 */
export declare const logSystemEvent: (event: string, details?: any) => void;
/**
 * Health check logging utility
 */
export declare const logHealthCheck: (status: string, details?: any) => void;
/**
 * Background job logging utility
 */
export declare const logBackgroundJob: (jobName: string, status: "started" | "completed" | "failed", details?: any) => void;
/**
 * Cache logging utility
 */
export declare const logCacheEvent: (operation: "hit" | "miss" | "set" | "delete", key: string, details?: any) => void;
/**
 * External service logging utility
 */
export declare const logExternalServiceCall: (service: string, operation: string, duration?: number, status?: string, error?: any) => void;
/**
 * File operation logging utility
 */
export declare const logFileOperation: (operation: "upload" | "download" | "delete", filename: string, details?: any) => void;
/**
 * Metrics logging utility
 */
export declare const logMetrics: (metrics: Record<string, number>) => void;
/**
 * Create structured log entry
 */
export declare const createLogEntry: (level: string, message: string, meta?: any) => any;
/**
 * Get logger instance
 */
export declare const getLogger: () => winston.Logger;
/**
 * Set log level dynamically
 */
export declare const setLogLevel: (level: string) => void;
/**
 * Add transport dynamically
 */
export declare const addTransport: (transport: winston.transport) => void;
/**
 * Remove transport dynamically
 */
export declare const removeTransport: (transport: winston.transport) => void;
/**
 * Export default logger
 */
export default logger;
//# sourceMappingURL=logger-simple.util.d.ts.map