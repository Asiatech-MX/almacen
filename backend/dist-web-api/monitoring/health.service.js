"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
exports.getHealthService = getHealthService;
const connection_pool_1 = require("../database/connection-pool");
const cache_1 = require("../cache");
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
/**
 * Health monitoring service with comprehensive system checks
 */
class HealthService {
    constructor() {
        this.startTime = Date.now();
        this.requestMetrics = {
            total: 0,
            errors: 0,
            totalResponseTime: 0
        };
    }
    /**
     * Get overall system health status
     */
    async getHealthStatus() {
        const components = [];
        // Database health check
        const dbHealth = await this.checkDatabaseHealth();
        components.push(dbHealth);
        // Cache health check
        const cacheHealth = await this.checkCacheHealth();
        components.push(cacheHealth);
        // Memory health check
        const memoryHealth = this.checkMemoryHealth();
        components.push(memoryHealth);
        // Determine overall status
        const overallStatus = this.determineOverallStatus(components);
        return {
            status: overallStatus,
            timestamp: new Date(),
            components,
            uptime: Date.now() - this.startTime,
            version: process.env.npm_package_version || '1.0.0'
        };
    }
    /**
     * Get system metrics
     */
    async getSystemMetrics() {
        const memory = this.getMemoryMetrics();
        const cpu = this.getCPUMetrics();
        const requests = this.getRequestMetrics();
        const performance = await this.getPerformanceMetrics();
        return {
            memory,
            cpu,
            requests,
            performance
        };
    }
    /**
     * Record request metrics
     */
    recordRequest(responseTime, isError = false) {
        this.requestMetrics.total++;
        if (isError) {
            this.requestMetrics.errors++;
        }
        this.requestMetrics.totalResponseTime += responseTime;
    }
    /**
     * Check database health
     */
    async checkDatabaseHealth() {
        const startTime = Date.now();
        try {
            const pool = (0, connection_pool_1.getConnectionPool)();
            const isHealthy = await pool.healthCheck();
            const responseTime = Date.now() - startTime;
            const poolStats = pool.getStats();
            if (!isHealthy) {
                return {
                    name: 'database',
                    status: 'unhealthy',
                    responseTime,
                    error: 'Database connection failed'
                };
            }
            // Check connection pool health
            const connectionUtilization = (poolStats.activeCount / poolStats.totalConnections) * 100;
            let status = 'healthy';
            if (connectionUtilization > 80) {
                status = 'degraded';
            }
            return {
                name: 'database',
                status,
                responseTime,
                details: {
                    totalConnections: poolStats.totalConnections,
                    activeConnections: poolStats.activeCount,
                    idleConnections: poolStats.idleCount,
                    connectionUtilization: Math.round(connectionUtilization)
                }
            };
        }
        catch (error) {
            return {
                name: 'database',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check cache health
     */
    async checkCacheHealth() {
        const startTime = Date.now();
        try {
            const cache = (0, cache_1.getCacheService)();
            const isHealthy = await cache.healthCheck();
            const responseTime = Date.now() - startTime;
            const stats = await cache.getStats();
            if (!isHealthy) {
                return {
                    name: 'cache',
                    status: 'unhealthy',
                    responseTime,
                    error: 'Cache connection failed'
                };
            }
            // Determine cache health based on hit rate
            let status = 'healthy';
            if (stats.hitRate < 50) {
                status = 'degraded';
            }
            return {
                name: 'cache',
                status,
                responseTime,
                details: {
                    hitRate: stats.hitRate,
                    totalKeys: stats.totalKeys,
                    memoryUsage: stats.memoryUsage,
                    hits: stats.hits,
                    misses: stats.misses
                }
            };
        }
        catch (error) {
            return {
                name: 'cache',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Check memory health
     */
    checkMemoryHealth() {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        const memoryPercentage = (usedMemory / totalMemory) * 100;
        let status = 'healthy';
        if (memoryPercentage > 90) {
            status = 'unhealthy';
        }
        else if (memoryPercentage > 75) {
            status = 'degraded';
        }
        return {
            name: 'memory',
            status,
            responseTime: 0,
            details: {
                heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
                heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
                heapPercentage: Math.round(memoryPercentage),
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024) // MB
            }
        };
    }
    /**
     * Get memory metrics
     */
    getMemoryMetrics() {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        return {
            used: usedMemory,
            total: totalMemory,
            percentage: (usedMemory / totalMemory) * 100,
            heapUsed: usedMemory,
            heapTotal: totalMemory
        };
    }
    /**
     * Get CPU metrics
     */
    getCPUMetrics() {
        // Note: In a real production environment, you might want to use
        // a more sophisticated CPU monitoring library like systeminformation
        return {
            usage: 0, // Placeholder
            loadAverage: process.platform !== 'win32'
                ? require('os').loadavg()
                : [0, 0, 0]
        };
    }
    /**
     * Get request metrics
     */
    getRequestMetrics() {
        const { total, errors, totalResponseTime } = this.requestMetrics;
        const averageResponseTime = total > 0 ? totalResponseTime / total : 0;
        const rate = total / ((Date.now() - this.startTime) / 1000); // requests per second
        return {
            total,
            errors,
            rate,
            averageResponseTime
        };
    }
    /**
     * Get performance metrics
     */
    async getPerformanceMetrics() {
        try {
            const cache = (0, cache_1.getCacheService)();
            const cacheStats = await cache.getStats();
            const pool = (0, connection_pool_1.getConnectionPool)();
            const poolStats = pool.getStats();
            const slowQueries = pool.getSlowQueries(1000, 100);
            return {
                cacheHitRate: cacheStats.hitRate,
                dbConnections: poolStats.totalConnections,
                slowQueries: slowQueries.length,
                averageQueryTime: poolStats.averageAcquisitionTime
            };
        }
        catch (error) {
            logger_simple_util_1.default.warn('⚠️ Failed to get performance metrics:', error);
            return {
                cacheHitRate: 0,
                dbConnections: 0,
                slowQueries: 0,
                averageQueryTime: 0
            };
        }
    }
    /**
     * Determine overall health status
     */
    determineOverallStatus(components) {
        const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
        const degradedCount = components.filter(c => c.status === 'degraded').length;
        if (unhealthyCount > 0) {
            return 'unhealthy';
        }
        if (degradedCount > 0) {
            return 'degraded';
        }
        return 'healthy';
    }
    /**
     * Health check endpoint middleware
     */
    healthCheck() {
        return async (req, res) => {
            try {
                const health = await this.getHealthStatus();
                const statusCode = health.status === 'healthy' ? 200 :
                    health.status === 'degraded' ? 200 : 503;
                res.status(statusCode).json(health);
            }
            catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
    }
    /**
     * Readiness check endpoint (for Kubernetes)
     */
    readinessCheck() {
        return async (req, res) => {
            try {
                const dbHealth = await this.checkDatabaseHealth();
                const cacheHealth = await this.checkCacheHealth();
                const isReady = dbHealth.status !== 'unhealthy' && cacheHealth.status !== 'unhealthy';
                res.status(isReady ? 200 : 503).json({
                    ready: isReady,
                    checks: {
                        database: dbHealth.status,
                        cache: cacheHealth.status
                    }
                });
            }
            catch (error) {
                res.status(503).json({
                    ready: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
    }
    /**
     * Liveness check endpoint (for Kubernetes)
     */
    livenessCheck() {
        return (req, res) => {
            // Simple liveness check - if server is responding, it's alive
            res.status(200).json({
                alive: true,
                timestamp: new Date(),
                uptime: Date.now() - this.startTime
            });
        };
    }
}
exports.HealthService = HealthService;
// Singleton instance
let healthService = null;
function getHealthService() {
    if (!healthService) {
        healthService = new HealthService();
    }
    return healthService;
}
exports.default = HealthService;
//# sourceMappingURL=health.service.js.map