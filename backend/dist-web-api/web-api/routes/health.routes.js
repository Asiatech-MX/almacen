"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const response_util_1 = require("../utils/response.util");
const health_util_1 = require("../utils/health.util");
const router = (0, express_1.Router)();
/**
 * Health check routes
 */
/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        const healthData = await (0, health_util_1.healthCheck)();
        (0, response_util_1.sendSuccessResponse)(res, healthData, 'Service is healthy');
    }
    catch (error) {
        sendErrorResponse(res, 'Health check failed', 503);
    }
});
/**
 * GET /api/health/ping
 * Simple ping endpoint for monitoring
 */
router.get('/ping', (req, res) => {
    (0, response_util_1.sendSuccessResponse)(res, { pong: true }, 'Service is responding');
});
/**
 * GET /api/health/version
 * Returns version information
 */
router.get('/version', (req, res) => {
    const versionInfo = {
        version: process.env.API_VERSION || 'v1.0.0',
        build: process.env.BUILD_NUMBER || 'development',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };
    (0, response_util_1.sendSuccessResponse)(res, versionInfo, 'Version information');
});
/**
 * GET /api/health/detailed
 * Detailed health check with all system information
 */
router.get('/detailed', async (req, res) => {
    try {
        const healthData = await (0, health_util_1.healthCheck)();
        const detailedInfo = {
            ...healthData,
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            database: healthData.database,
            cache: {
                status: 'active',
                size: 'unknown' // Would need cache implementation
            },
            timestamp: new Date().toISOString()
        };
        (0, response_util_1.sendSuccessResponse)(res, detailedInfo, 'Detailed health information');
    }
    catch (error) {
        sendErrorResponse(res, 'Detailed health check failed', 503);
    }
});
/**
 * GET /api/health/database
 * Database health check
 */
router.get('/database', async (req, res) => {
    try {
        const healthData = await (0, health_util_1.healthCheck)();
        (0, response_util_1.sendSuccessResponse)(res, healthData.database, 'Database health check');
    }
    catch (error) {
        sendErrorResponse(res, 'Database health check failed', 503);
    }
});
/**
 * GET /api/health/cache
 * Cache health check
 */
router.get('/cache', (req, res) => {
    try {
        // This would check cache health
        const cacheStatus = {
            status: 'active',
            size: 'unknown',
            hits: 0,
            misses: 0,
            hitRate: 0
        };
        (0, response_util_1.sendSuccessResponse)(res, cacheStatus, 'Cache health check');
    }
    catch (error) {
        sendErrorResponse(res, 'Cache health check failed', 503);
    }
});
/**
 * GET /api/health/external
 * External services health check
 */
router.get('/external', async (req, res) => {
    try {
        // This would check external service health
        const externalStatus = {
            status: 'unknown',
            services: []
        };
        (0, response_util_1.sendSuccessResponse)(res, externalStatus, 'External services health check');
    }
    catch (error) {
        sendErrorResponse(res, 'External services health check failed', 503);
    }
});
//# sourceMappingURL=health.routes.js.map