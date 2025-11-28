"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getPoolStats = exports.closePool = exports.getDatabaseVersion = exports.sanitizeSqlInput = exports.isValidIdentifier = exports.escapeValue = exports.escapeIdentifier = exports.buildPaginatedQuery = exports.buildLimitOffsetClause = exports.buildOrderByClause = exports.buildWhereClause = exports.getTableRowCount = exports.tableExists = exports.getTableInfo = exports.getDatabaseStats = exports.testConnection = exports.releaseConnection = exports.getConnection = exports.transaction = exports.queryMany = exports.queryOne = exports.query = void 0;
const pg_1 = require("pg");
const web_api_cjs_1 = require("../config/web-api.cjs");
/**
 * Database utility functions
 */
// Create connection pool
const pool = new pg_1.Pool({
    host: web_api_cjs_1.config.database.host,
    port: web_api_cjs_1.config.database.port,
    database: web_api_cjs_1.config.database.name,
    user: web_api_cjs_1.config.database.user,
    password: web_api_cjs_1.config.database.password,
    ssl: web_api_cjs_1.config.database.ssl,
    max: web_api_cjs_1.config.database.maxConnections,
    connectionTimeoutMillis: web_api_cjs_1.config.database.connectionTimeout,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false
});
/**
 * Execute a query with optional parameters
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        // Log query in development
        if (web_api_cjs_1.config.nodeEnv === 'development') {
            console.log(`Query executed in ${duration}ms:`, { text, params });
        }
        return result;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};
exports.query = query;
/**
 * Execute a single query returning a single row
 */
const queryOne = async (text, params) => {
    const result = await (0, exports.query)(text, params);
    return result.rows[0];
};
exports.queryOne = queryOne;
/**
 * Execute a query returning multiple rows
 */
const queryMany = async (text, params) => {
    const result = await (0, exports.query)(text, params);
    return result.rows;
};
exports.queryMany = queryMany;
/**
 * Execute a transaction
 */
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
/**
 * Get database connection
 */
const getConnection = async () => {
    return await pool.connect();
};
exports.getConnection = getConnection;
/**
 * Release database connection
 */
const releaseConnection = (client) => {
    client.release();
};
exports.releaseConnection = releaseConnection;
/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const result = await (0, exports.query)('SELECT 1 as test');
        return result.rows.length > 0;
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
    try {
        const stats = await (0, exports.query)(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY schemaname, tablename, attname
    `);
        return stats.rows;
    }
    catch (error) {
        console.error('Failed to get database stats:', error);
        return [];
    }
};
exports.getDatabaseStats = getDatabaseStats;
/**
 * Get table information
 */
const getTableInfo = async (tableName) => {
    try {
        const result = await (0, exports.query)(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
        return result.rows;
    }
    catch (error) {
        console.error(`Failed to get table info for ${tableName}:`, error);
        return [];
    }
};
exports.getTableInfo = getTableInfo;
/**
 * Check if table exists
 */
const tableExists = async (tableName) => {
    try {
        const result = await (0, exports.query)(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )
    `, [tableName]);
        return result.rows[0].exists;
    }
    catch (error) {
        console.error(`Failed to check if table ${tableName} exists:`, error);
        return false;
    }
};
exports.tableExists = tableExists;
/**
 * Get table row count
 */
const getTableRowCount = async (tableName) => {
    try {
        const result = await (0, exports.query)(`SELECT COUNT(*) FROM ${tableName}`);
        return parseInt(result.rows[0].count);
    }
    catch (error) {
        console.error(`Failed to get row count for ${tableName}:`, error);
        return 0;
    }
};
exports.getTableRowCount = getTableRowCount;
/**
 * Build WHERE clause from filters
 */
const buildWhereClause = (filters) => {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                const placeholders = value.map(() => `$${paramIndex++}`);
                conditions.push(`${key} IN (${placeholders.join(', ')})`);
                params.push(...value);
            }
            else if (typeof value === 'string' && value.includes('%')) {
                conditions.push(`${key} LIKE $${paramIndex++}`);
                params.push(value);
            }
            else {
                conditions.push(`${key} = $${paramIndex++}`);
                params.push(value);
            }
        }
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params, paramIndex };
};
exports.buildWhereClause = buildWhereClause;
/**
 * Build ORDER BY clause
 */
const buildOrderByClause = (sortBy, sortOrder = 'asc') => {
    if (!sortBy)
        return '';
    return `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
};
exports.buildOrderByClause = buildOrderByClause;
/**
 * Build LIMIT and OFFSET clause
 */
const buildLimitOffsetClause = (page, limit) => {
    const offset = (page - 1) * limit;
    return `LIMIT ${limit} OFFSET ${offset}`;
};
exports.buildLimitOffsetClause = buildLimitOffsetClause;
/**
 * Build pagination query
 */
const buildPaginatedQuery = (baseQuery, page, limit, sortBy, sortOrder = 'asc') => {
    const orderByClause = (0, exports.buildOrderByClause)(sortBy, sortOrder);
    const limitOffsetClause = (0, exports.buildLimitOffsetClause)(page, limit);
    const query = `${baseQuery} ${orderByClause} ${limitOffsetClause}`;
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as count`;
    return { query, countQuery };
};
exports.buildPaginatedQuery = buildPaginatedQuery;
/**
 * Escape identifier for SQL queries
 */
const escapeIdentifier = (identifier) => {
    return `"${identifier.replace(/"/g, '""')}"`;
};
exports.escapeIdentifier = escapeIdentifier;
/**
 * Escape value for SQL queries
 */
const escapeValue = (value) => {
    if (value === null || value === undefined)
        return 'NULL';
    if (typeof value === 'string')
        return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean')
        return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number')
        return value.toString();
    return `'${JSON.stringify(value)}'`;
};
exports.escapeValue = escapeValue;
/**
 * Validate SQL identifier
 */
const isValidIdentifier = (identifier) => {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
};
exports.isValidIdentifier = isValidIdentifier;
/**
 * Sanitize SQL input
 */
const sanitizeSqlInput = (input) => {
    // Remove potential SQL injection patterns
    return input
        .replace(/[';]/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
        .trim();
};
exports.sanitizeSqlInput = sanitizeSqlInput;
/**
 * Get database version
 */
const getDatabaseVersion = async () => {
    try {
        const result = await (0, exports.query)('SELECT version()');
        return result.rows[0].version;
    }
    catch (error) {
        console.error('Failed to get database version:', error);
        return 'Unknown';
    }
};
exports.getDatabaseVersion = getDatabaseVersion;
/**
 * Close database connection pool
 */
const closePool = async () => {
    await pool.end();
};
exports.closePool = closePool;
/**
 * Get pool statistics
 */
const getPoolStats = () => {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
};
exports.getPoolStats = getPoolStats;
/**
 * Health check for database
 */
const healthCheck = async () => {
    try {
        const isConnected = await (0, exports.testConnection)();
        const stats = (0, exports.getPoolStats)();
        const version = await (0, exports.getDatabaseVersion)();
        return {
            status: isConnected ? 'healthy' : 'unhealthy',
            details: {
                connected: isConnected,
                poolStats: stats,
                version,
                config: {
                    host: web_api_cjs_1.config.database.host,
                    port: web_api_cjs_1.config.database.port,
                    database: web_api_cjs_1.config.database.name,
                    maxConnections: web_api_cjs_1.config.database.maxConnections
                }
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                error: error.message,
                config: {
                    host: web_api_cjs_1.config.database.host,
                    port: web_api_cjs_1.config.database.port,
                    database: web_api_cjs_1.config.database.name
                }
            }
        };
    }
};
exports.healthCheck = healthCheck;
exports.default = {
    query: exports.query,
    queryOne: exports.queryOne,
    queryMany: exports.queryMany,
    transaction: exports.transaction,
    getConnection: exports.getConnection,
    releaseConnection: exports.releaseConnection,
    testConnection: exports.testConnection,
    getDatabaseStats: exports.getDatabaseStats,
    getTableInfo: exports.getTableInfo,
    tableExists: exports.tableExists,
    getTableRowCount: exports.getTableRowCount,
    buildWhereClause: exports.buildWhereClause,
    buildOrderByClause: exports.buildOrderByClause,
    buildLimitOffsetClause: exports.buildLimitOffsetClause,
    buildPaginatedQuery: exports.buildPaginatedQuery,
    escapeIdentifier: exports.escapeIdentifier,
    escapeValue: exports.escapeValue,
    isValidIdentifier: exports.isValidIdentifier,
    sanitizeSqlInput: exports.sanitizeSqlInput,
    getDatabaseVersion: exports.getDatabaseVersion,
    closePool: exports.closePool,
    getPoolStats: exports.getPoolStats,
    healthCheck: exports.healthCheck
};
//# sourceMappingURL=database.util.js.map