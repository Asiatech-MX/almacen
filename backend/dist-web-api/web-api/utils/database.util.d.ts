import { PoolClient } from 'pg';
/**
 * Execute a query with optional parameters
 */
export declare const query: (text: string, params?: any[]) => Promise<any>;
/**
 * Execute a single query returning a single row
 */
export declare const queryOne: (text: string, params?: any[]) => Promise<any>;
/**
 * Execute a query returning multiple rows
 */
export declare const queryMany: (text: string, params?: any[]) => Promise<any[]>;
/**
 * Execute a transaction
 */
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
/**
 * Get database connection
 */
export declare const getConnection: () => Promise<PoolClient>;
/**
 * Release database connection
 */
export declare const releaseConnection: (client: PoolClient) => void;
/**
 * Test database connection
 */
export declare const testConnection: () => Promise<boolean>;
/**
 * Get database statistics
 */
export declare const getDatabaseStats: () => Promise<any>;
/**
 * Get table information
 */
export declare const getTableInfo: (tableName: string) => Promise<any>;
/**
 * Check if table exists
 */
export declare const tableExists: (tableName: string) => Promise<boolean>;
/**
 * Get table row count
 */
export declare const getTableRowCount: (tableName: string) => Promise<number>;
/**
 * Build WHERE clause from filters
 */
export declare const buildWhereClause: (filters: Record<string, any>) => {
    whereClause: string;
    params: any[];
    paramIndex: number;
};
/**
 * Build ORDER BY clause
 */
export declare const buildOrderByClause: (sortBy?: string, sortOrder?: "asc" | "desc") => string;
/**
 * Build LIMIT and OFFSET clause
 */
export declare const buildLimitOffsetClause: (page: number, limit: number) => string;
/**
 * Build pagination query
 */
export declare const buildPaginatedQuery: (baseQuery: string, page: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") => {
    query: string;
    countQuery: string;
};
/**
 * Escape identifier for SQL queries
 */
export declare const escapeIdentifier: (identifier: string) => string;
/**
 * Escape value for SQL queries
 */
export declare const escapeValue: (value: any) => string;
/**
 * Validate SQL identifier
 */
export declare const isValidIdentifier: (identifier: string) => boolean;
/**
 * Sanitize SQL input
 */
export declare const sanitizeSqlInput: (input: string) => string;
/**
 * Get database version
 */
export declare const getDatabaseVersion: () => Promise<string>;
/**
 * Close database connection pool
 */
export declare const closePool: () => Promise<void>;
/**
 * Get pool statistics
 */
export declare const getPoolStats: () => any;
/**
 * Health check for database
 */
export declare const healthCheck: () => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
declare const _default: {
    query: (text: string, params?: any[]) => Promise<any>;
    queryOne: (text: string, params?: any[]) => Promise<any>;
    queryMany: (text: string, params?: any[]) => Promise<any[]>;
    transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
    getConnection: () => Promise<PoolClient>;
    releaseConnection: (client: PoolClient) => void;
    testConnection: () => Promise<boolean>;
    getDatabaseStats: () => Promise<any>;
    getTableInfo: (tableName: string) => Promise<any>;
    tableExists: (tableName: string) => Promise<boolean>;
    getTableRowCount: (tableName: string) => Promise<number>;
    buildWhereClause: (filters: Record<string, any>) => {
        whereClause: string;
        params: any[];
        paramIndex: number;
    };
    buildOrderByClause: (sortBy?: string, sortOrder?: "asc" | "desc") => string;
    buildLimitOffsetClause: (page: number, limit: number) => string;
    buildPaginatedQuery: (baseQuery: string, page: number, limit: number, sortBy?: string, sortOrder?: "asc" | "desc") => {
        query: string;
        countQuery: string;
    };
    escapeIdentifier: (identifier: string) => string;
    escapeValue: (value: any) => string;
    isValidIdentifier: (identifier: string) => boolean;
    sanitizeSqlInput: (input: string) => string;
    getDatabaseVersion: () => Promise<string>;
    closePool: () => Promise<void>;
    getPoolStats: () => any;
    healthCheck: () => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
};
export default _default;
//# sourceMappingURL=database.util.d.ts.map