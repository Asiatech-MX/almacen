"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkHealthCheck = exports.fileSystemHealthCheck = exports.cacheHealthCheck = exports.dependencyHealthCheck = exports.getAllFeatureStatuses = exports.getFeatureStatus = exports.isFeatureEnabled = exports.getMaintenanceMessage = exports.isMaintenanceMode = exports.createHealthResponse = exports.healthCheckWithRetry = exports.healthCheckWithTimeout = exports.componentHealthCheck = exports.comprehensiveHealthCheck = exports.externalServiceHealthCheck = exports.applicationHealthCheck = exports.systemHealthCheck = exports.memoryHealthCheck = exports.databaseHealthCheck = exports.basicHealthCheck = void 0;
const database_util_1 = require("../utils/database.util");
const database_util_2 = require("../utils/database.util");
const web_api_cjs_1 = require("../config/web-api.cjs");
/**
 * Health check utilities
 */
/**
 * Basic health check
 */
const basicHealthCheck = () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    environment: web_api_cjs_1.config.nodeEnv
});
exports.basicHealthCheck = basicHealthCheck;
/**
 * Database health check
 */
const databaseHealthCheck = async () => {
    try {
        const dbStats = await (0, database_util_1.getDatabaseStats)();
        const poolStats = (0, database_util_2.getPoolStats)();
        const dbVersion = await query('SELECT version()');
        return {
            status: 'healthy',
            details: {
                connected: poolStats.idleCount < poolStats.totalCount,
                totalConnections: poolStats.totalCount,
                idleConnections: poolStats.idleCount,
                waitingCount: poolStats.waitingCount,
                version: dbVersion.rows[0]?.version || 'unknown',
                stats: dbStats
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                error: error.message
            }
        };
    }
};
exports.databaseHealthCheck = databaseHealthCheck;
/**
 * Memory health check
 */
const memoryHealthCheck = () => {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    const freeMemory = totalMemory - usedMemory;
    return {
        used: usedMemory,
        total: totalMemory,
        free: freeMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100),
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
    };
};
exports.memoryHealthCheck = memoryHealthCheck;
/**
 * System health check
 */
const systemHealthCheck = () => {
    const loadAverage = require('os').loadavg();
    const cpus = require('os').cpus();
    const platform = require('os').platform();
    const arch = require('os').arch();
    const networkInterfaces = require('os').networkInterfaces();
    return {
        platform,
        arch,
        nodeVersion: process.version,
        loadAverage,
        cpus,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem(),
        networkInterfaces: networkInterfaces.map(iface => ({
            name: iface.name,
            address: iface.address,
            netmask: iface.netmask,
            family: iface.family,
            mac: iface.mac,
            internal: iface.internal,
            scopeid: iface.scopeid
        }))
    };
};
exports.systemHealthCheck = systemHealthCheck;
/**
 * Application health check
 */
const applicationHealthCheck = () => {
    const memory = (0, exports.memoryHealthCheck)();
    const system = (0, exports.systemHealthCheck)();
    return {
        memory,
        system,
        pid: process.pid,
        uptime: process.uptime(),
        version: process.env.npm_package_version || 'unknown',
        environment: web_api_cjs_1.config.nodeEnv
    };
};
exports.applicationHealthCheck = applicationHealthCheck;
/**
 * External service health check
 */
const externalServiceHealthCheck = async (serviceUrl, timeout = 5000) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
        const response = await fetch(serviceUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'almacen-health-check/1.0.0'
            }
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            return {
                status: 'healthy',
                details: {
                    statusCode: response.status,
                    responseTime: response.headers.get('x-response-time'),
                    contentType: response.headers.get('content-type')
                }
            };
        }
        else {
            return {
                status: 'unhealthy',
                details: {
                    statusCode: response.status,
                    statusText: response.statusText
                }
            };
        }
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                error: error.message
            }
        };
    }
};
exports.externalServiceHealthCheck = externalServiceHealthCheck;
/**
 * Comprehensive health check
 */
const comprehensiveHealthCheck = async () => {
    const basic = (0, exports.basicHealthCheck)();
    const database = await (0, exports.databaseHealthCheck)();
    const memory = (0, exports.memoryHealthCheck)();
    const system = (0, exports.systemHealthCheck)();
    const application = (0, exports.applicationHealthCheck)();
    const allHealthy = [
        basic.status === 'OK',
        database.status === 'healthy',
        memory.percentage < 90, // Alert if memory usage is high
        system.loadAverage < 2 // Alert if load average is high
    ].every(Boolean);
    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: {
            basic,
            database,
            memory,
            system,
            application
        }
    };
};
exports.comprehensiveHealthCheck = comprehensiveHealthCheck;
/**
 * Health check for specific component
 */
const componentHealthCheck = async (componentName, checkFunction) => {
    try {
        const result = await checkFunction();
        return {
            status: result.status || 'healthy',
            details: {
                component: componentName,
                ...result.details
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                component: componentName,
                error: error.message
            }
        };
    }
};
exports.componentHealthCheck = componentHealthCheck;
/**
 * Health check with timeout
 */
const healthCheckWithTimeout = async (healthCheckFunction, timeoutMs = 5000) => {
    const timeoutPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Health check timeout'));
        }, timeoutMs);
        healthCheckFunction()
            .then(resolve)
            .catch(reject)
            .finally(() => {
            clearTimeout(timeoutId);
        });
    });
    return timeoutPromise;
};
exports.healthCheckWithTimeout = healthCheckWithTimeout;
/**
 * Health check with retry
 */
const healthCheckWithRetry = async (healthCheckFunction, maxRetries = 3, retryDelay = 1000) => {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await healthCheckFunction();
            return result;
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                throw lastError;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
    throw lastError;
};
exports.healthCheckWithRetry = healthCheckWithRetry;
/**
 * Create health response
 */
const createHealthResponse = (status, data, message) => {
    return {
        status,
        data,
        message: message || (status === 'OK' ? 'Service is healthy' : 'Service is unhealthy'),
        timestamp: new Date().toISOString()
    };
};
exports.createHealthResponse = createHealthResponse;
/**
 * Check if service is in maintenance mode
 */
const isMaintenanceMode = () => {
    return process.env.MAINTENANCE_MODE === 'true';
};
exports.isMaintenanceMode = isMaintenanceMode;
/**
 * Get maintenance message
 */
const getMaintenanceMessage = () => {
    return process.env.MAINTENANCE_MESSAGE || 'Service is currently under maintenance';
};
exports.getMaintenanceMessage = getMaintenanceMessage;
/**
 * Check if feature is enabled
 */
const isFeatureEnabled = (featureName) => {
    const envVar = `ENABLE_${featureName.toUpperCase()}`;
    return process.env[envVar] === 'true';
};
exports.isFeatureEnabled = isFeatureEnabled;
/**
 * Get feature status
 */
const getFeatureStatus = (featureName) => {
    const envVar = `ENABLE_${featureName.toUpperCase()}`;
    const isEnabled = process.env[envVar] === 'true';
    const isDisabled = process.env[`${envVar}_DISABLED`] === 'true';
    return {
        enabled: isEnabled,
        disabled: isDisabled,
        status: isEnabled ? 'enabled' : isDisabled ? 'disabled' : 'unknown'
    };
};
exports.getFeatureStatus = getFeatureStatus;
/**
 * Get all feature statuses
 */
const getAllFeatureStatuses = () => {
    const features = [
        'METRICS',
        'HEALTH_CHECK',
        'API_DOCS',
        'SWAGGER',
        'PLAYGROUND',
        'CACHE',
        'AUDIT_LOGGING',
        'PERFORMANCE_MONITORING'
    ];
    const statuses = {};
    for (const feature of features) {
        statuses[feature] = (0, exports.getFeatureStatus)(feature);
    }
    return statuses;
};
exports.getAllFeatureStatuses = getAllFeatureStatuses;
/**
 * Health check for dependencies
 */
const dependencyHealthCheck = async (dependencies) => {
    const results = await Promise.all(dependencies.map(dep => (0, exports.externalServiceHealthCheck)(dep.url, dep.timeout)));
    const allHealthy = results.every(result => result.status === 'healthy');
    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: {
            dependencies: dependencies.map((dep, index) => ({
                name: dep.name,
                url: dep.url,
                status: results[index].status,
                details: results[index].details
            }))
        }
    };
};
exports.dependencyHealthCheck = dependencyHealthCheck;
/**
 * Health check for cache
 */
const cacheHealthCheck = () => {
    // This would typically check Redis or other cache system
    // For now, return a mock response
    return {
        status: 'healthy',
        details: {
            type: 'mock',
            message: 'Cache system not implemented'
        }
    };
};
exports.cacheHealthCheck = cacheHealthCheck;
/**
 * Health check for file system
 */
const fileSystemHealthCheck = () => {
    const fs = require('fs');
    try {
        // Test write access
        const testFile = './health-check-test.tmp';
        fs.writeFileSync(testFile, 'health check');
        fs.unlinkSync(testFile);
        // Test read access
        const stats = fs.statSync('.');
        return {
            status: 'healthy',
            details: {
                writable: stats.mode & 0o200, // Write permissions
                readable: stats.mode & 0o444, // Read permissions
                freeSpace: stats.free,
                totalSpace: stats.size
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                error: error.message
            }
        };
    }
};
exports.fileSystemHealthCheck = fileSystemHealthCheck;
/**
 * Health check for network connectivity
 */
const networkHealthCheck = async (host = '8.8.8.8', port = 53, timeout = 5000) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
        const response = await fetch(`http://${host}:${port}`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'almacen-health-check/1.0.0'
            }
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            return {
                status: 'healthy',
                details: {
                    host,
                    port,
                    statusCode: response.status,
                    responseTime: response.headers.get('x-response-time')
                }
            };
        }
        else {
            return {
                status: 'unhealthy',
                details: {
                    host,
                    port,
                    statusCode: response.status,
                    statusText: response.statusText
                }
            };
        }
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                host,
                port,
                error: error.message
            }
        };
    }
};
exports.networkHealthCheck = networkHealthCheck;
exports.default = {
    basicHealthCheck: exports.basicHealthCheck,
    databaseHealthCheck: exports.databaseHealthCheck,
    memoryHealthCheck: exports.memoryHealthCheck,
    systemHealthCheck: exports.systemHealthCheck,
    applicationHealthCheck: exports.applicationHealthCheck,
    comprehensiveHealthCheck: exports.comprehensiveHealthCheck,
    componentHealthCheck: exports.componentHealthCheck,
    healthCheckWithTimeout: exports.healthCheckWithTimeout,
    healthCheckWithRetry: exports.healthCheckWithRetry,
    createHealthResponse: exports.createHealthResponse,
    isMaintenanceMode: exports.isMaintenanceMode,
    getMaintenanceMessage: exports.getMaintenanceMessage,
    isFeatureEnabled: exports.isFeatureEnabled,
    getFeatureStatus: exports.getFeatureStatus,
    getAllFeatureStatuses: exports.getAllFeatureStatuses,
    dependencyHealthCheck: exports.dependencyHealthCheck,
    cacheHealthCheck: exports.cacheHealthCheck,
    fileSystemHealthCheck: exports.fileSystemHealthCheck,
    networkHealthCheck: exports.networkHealthCheck
};
//# sourceMappingURL=health.util.js.map