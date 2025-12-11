"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedConnectionPool = void 0;
exports.getConnectionPool = getConnectionPool;
const pg_1 = require("pg");
const cache_1 = require("../cache");
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
const config_1 = require("./config");
/**
 * Enhanced connection pool with monitoring, caching and performance optimization
 */
class EnhancedConnectionPool {
    constructor() {
        this.cache = (0, cache_1.getCacheService)();
        this.metrics = [];
        this.maxMetricsHistory = 1000;
        const poolConfig = {
            ...config_1.databaseConfig,
            // Optimized pool settings
            max: config_1.databaseConfig.max || 20,
            min: 2,
            idleTimeoutMillis: config_1.databaseConfig.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config_1.databaseConfig.connectionTimeoutMillis || 2000,
            // Advanced configuration
            allowExitOnIdle: false,
            keepAlive: true,
            keepAliveInitialDelayMillis: 0,
            // Statement timeout for long-running queries
            statement_timeout: 30000, // 30 seconds
            query_timeout: 25000, // 25 seconds
            // Connection validation
            application_name: 'almacen-backend',
            // SSL configuration
            ssl: config_1.databaseConfig.ssl ? {
                rejectUnauthorized: false
            } : false,
            // Callbacks
            onCreate: (client) => {
                logger_simple_util_1.default.debug('🔗 New database connection created');
            },
            onAcquire: (client) => {
                logger_simple_util_1.default.debug('📥 Database connection acquired');
            },
            onRemove: (client) => {
                logger_simple_util_1.default.debug('📤 Database connection removed');
            },
            onRelease: (client) => {
                logger_simple_util_1.default.debug('📤 Database connection released');
            }
        };
        this.pool = new pg_1.Pool(poolConfig);
        // Event listeners
        this.pool.on('connect', () => {
            logger_simple_util_1.default.info('🔌 Database pool connected');
        });
        this.pool.on('acquire', () => {
            logger_simple_util_1.default.debug('📥 Connection acquired from pool');
        });
        this.pool.on('release', () => {
            logger_simple_util_1.default.debug('📤 Connection released to pool');
        });
        this.pool.on('remove', () => {
            logger_simple_util_1.default.debug('🗑️ Connection removed from pool');
        });
        this.pool.on('error', (error, client) => {
            logger_simple_util_1.default.error('❌ Database pool error:', error);
            if (client) {
                logger_simple_util_1.default.error('❌ Error on client:', client);
            }
        });
    }
    /**
     * Execute query with caching and performance monitoring
     */
    async query(text, params, cacheOptions) {
        const startTime = Date.now();
        let cacheHit = false;
        let result;
        try {
            // Check cache if options provided
            if (cacheOptions) {
                const cached = await this.cache.get(cacheOptions.key, { json: true });
                if (cached) {
                    cacheHit = true;
                    this.recordMetrics(text, Date.now() - startTime, 0, true);
                    return cached;
                }
            }
            // Execute query
            const queryResult = await this.pool.query(text, params);
            result = queryResult.rows;
            // Cache result if options provided and successful
            if (cacheOptions && result) {
                await this.cache.set(cacheOptions.key, result, { ttl: cacheOptions.ttl });
            }
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            logger_simple_util_1.default.error(`❌ Query failed (${executionTime}ms):`, { text: text.substring(0, 100), error: error.message });
            throw error;
        }
        const executionTime = Date.now() - startTime;
        this.recordMetrics(text, executionTime, Array.isArray(result) ? result.length : 0, cacheHit);
        // Log slow queries
        if (executionTime > 1000) {
            logger_simple_util_1.default.warn(`🐌 Slow query detected (${executionTime}ms):`, text.substring(0, 100));
        }
        return result;
    }
    /**
     * Execute query with automatic retry and circuit breaker
     */
    async queryWithRetry(text, params, maxRetries = 3, backoffMs = 100) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.query(text, params);
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    logger_simple_util_1.default.error(`❌ Query failed after ${maxRetries} attempts:`, error);
                    throw lastError;
                }
                // Exponential backoff with jitter
                const delay = backoffMs * Math.pow(2, attempt - 1) + Math.random() * 100;
                logger_simple_util_1.default.warn(`⚠️ Query attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    /**
     * Get connection from pool for transaction
     */
    async getConnection() {
        return await this.pool.connect();
    }
    /**
     * Execute transaction with retry logic
     */
    async transaction(callback, maxRetries = 2) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const client = await this.getConnection();
            try {
                await client.query('BEGIN');
                const result = await callback(client);
                await client.query('COMMIT');
                return result;
            }
            catch (error) {
                await client.query('ROLLBACK');
                lastError = error;
                if (attempt === maxRetries) {
                    throw lastError;
                }
                // Brief delay between retries
                await this.sleep(50);
            }
            finally {
                client.release();
            }
        }
        throw lastError;
    }
    /**
     * Get pool statistics
     */
    getStats() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            activeCount: this.pool.totalCount - this.pool.idleCount,
            totalConnections: this.pool.totalCount,
            averageAcquisitionTime: this.calculateAverageAcquisitionTime(),
            lastAcquisitionTime: Date.now()
        };
    }
    /**
     * Get query performance metrics
     */
    getPerformanceMetrics(limit = 100) {
        return this.metrics
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Get slow queries
     */
    getSlowQueries(thresholdMs = 1000, limit = 50) {
        return this.metrics
            .filter(metric => metric.executionTime > thresholdMs)
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, limit);
    }
    /**
     * Clear performance metrics
     */
    clearMetrics() {
        this.metrics = [];
    }
    /**
     * Health check for the pool
     */
    async healthCheck() {
        try {
            await this.pool.query('SELECT 1');
            return true;
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Database pool health check failed:', error);
            return false;
        }
    }
    /**
     * Graceful shutdown
     */
    async close() {
        await this.pool.end();
        logger_simple_util_1.default.info('🔌 Database pool closed');
    }
    /**
     * Record query metrics
     */
    recordMetrics(query, executionTime, rowCount, cacheHit) {
        const metric = {
            query: query.substring(0, 200), // Limit query length
            executionTime,
            rowCount,
            cacheHit,
            timestamp: new Date()
        };
        this.metrics.push(metric);
        // Limit history size
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }
    }
    /**
     * Calculate average acquisition time
     */
    calculateAverageAcquisitionTime() {
        if (this.metrics.length === 0)
            return 0;
        const total = this.metrics.reduce((sum, metric) => sum + metric.executionTime, 0);
        return total / this.metrics.length;
    }
    /**
     * Sleep helper for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.EnhancedConnectionPool = EnhancedConnectionPool;
// Singleton instance
let connectionPool = null;
function getConnectionPool() {
    if (!connectionPool) {
        connectionPool = new EnhancedConnectionPool();
    }
    return connectionPool;
}
exports.default = EnhancedConnectionPool;
//# sourceMappingURL=connection-pool.js.map