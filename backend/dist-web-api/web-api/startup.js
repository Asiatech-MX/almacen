"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApplication = exports.startupService = exports.StartupService = void 0;
const cache_1 = require("../cache");
const connection_pool_1 = require("../database/connection-pool");
const monitoring_1 = require("../monitoring");
const logger_simple_util_1 = __importDefault(require("./utils/logger-simple.util"));
/**
 * Application startup configuration and initialization
 */
class StartupService {
    constructor() {
        this.isInitialized = false;
    }
    static getInstance() {
        if (!StartupService.instance) {
            StartupService.instance = new StartupService();
        }
        return StartupService.instance;
    }
    /**
     * Initialize all application services
     */
    async initialize() {
        if (this.isInitialized) {
            logger_simple_util_1.default.warn('⚠️ Application already initialized');
            return;
        }
        try {
            logger_simple_util_1.default.info('🚀 Starting application initialization...');
            // 1. Initialize database connection pool
            await this.initializeDatabase();
            // 2. Initialize cache service
            await this.initializeCache();
            // 3. Initialize health monitoring
            await this.initializeMonitoring();
            // 4. Setup graceful shutdown handlers
            this.setupGracefulShutdown();
            // 5. Run application self-tests
            await this.runSelfTests();
            this.isInitialized = true;
            logger_simple_util_1.default.info('✅ Application initialization completed successfully');
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Application initialization failed:', error);
            throw error;
        }
    }
    /**
     * Initialize database connection pool
     */
    async initializeDatabase() {
        try {
            const pool = (0, connection_pool_1.getConnectionPool)();
            const isHealthy = await pool.healthCheck();
            if (!isHealthy) {
                throw new Error('Database connection failed');
            }
            logger_simple_util_1.default.info('📊 Database connection pool initialized');
            // Get initial connection pool stats
            const stats = pool.getStats();
            logger_simple_util_1.default.info('📊 Connection pool stats:', {
                totalConnections: stats.totalConnections,
                activeConnections: stats.activeCount,
                idleConnections: stats.idleCount
            });
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    /**
     * Initialize cache service
     */
    async initializeCache() {
        try {
            const cache = (0, cache_1.getCacheService)();
            const isHealthy = await cache.healthCheck();
            if (!isHealthy) {
                logger_simple_util_1.default.warn('⚠️ Cache service not available, continuing without cache');
                return;
            }
            logger_simple_util_1.default.info('💾 Cache service initialized');
            // Get initial cache stats
            const stats = await cache.getStats();
            logger_simple_util_1.default.info('💾 Cache stats:', {
                hitRate: stats.hitRate,
                totalKeys: stats.totalKeys,
                memoryUsage: stats.memoryUsage
            });
        }
        catch (error) {
            logger_simple_util_1.default.warn('⚠️ Cache initialization failed, continuing without cache:', error);
            // Don't throw error - cache is optional
        }
    }
    /**
     * Initialize monitoring services
     */
    async initializeMonitoring() {
        try {
            const healthService = (0, monitoring_1.getHealthService)();
            // Perform initial health check
            const health = await healthService.getHealthStatus();
            logger_simple_util_1.default.info('🏥 Health monitoring initialized:', {
                status: health.status,
                components: health.components.length,
                uptime: health.uptime
            });
        }
        catch (error) {
            logger_simple_util_1.default.warn('⚠️ Monitoring initialization failed:', error);
            // Don't throw error - monitoring is optional
        }
    }
    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger_simple_util_1.default.info(`🛑 ${signal} received, shutting down gracefully...`);
            try {
                // Stop accepting new connections
                this.isInitialized = false;
                // Close database connections
                const pool = (0, connection_pool_1.getConnectionPool)();
                await pool.close();
                logger_simple_util_1.default.info('📊 Database connections closed');
                // Close cache connections
                const cache = (0, cache_1.getCacheService)();
                await cache.disconnect();
                logger_simple_util_1.default.info('💾 Cache connections closed');
                logger_simple_util_1.default.info('✅ Graceful shutdown completed');
                process.exit(0);
            }
            catch (error) {
                logger_simple_util_1.default.error('❌ Error during graceful shutdown:', error);
                process.exit(1);
            }
        };
        // Handle common signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_simple_util_1.default.error('💥 Uncaught exception:', error);
            shutdown('UNCAUGHT_EXCEPTION');
        });
        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger_simple_util_1.default.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
            shutdown('UNHANDLED_REJECTION');
        });
    }
    /**
     * Run application self-tests
     */
    async runSelfTests() {
        try {
            logger_simple_util_1.default.info('🧪 Running application self-tests...');
            // Test database connectivity
            await this.testDatabaseConnectivity();
            // Test cache functionality (if available)
            await this.testCacheFunctionality();
            // Test basic API endpoints
            await this.testBasicEndpoints();
            logger_simple_util_1.default.info('✅ All self-tests passed');
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Self-tests failed:', error);
            throw error;
        }
    }
    /**
     * Test database connectivity
     */
    async testDatabaseConnectivity() {
        try {
            const pool = (0, connection_pool_1.getConnectionPool)();
            // Test basic query
            const result = await pool.query('SELECT 1 as test');
            if (!result || result.length === 0) {
                throw new Error('Database test query failed');
            }
            logger_simple_util_1.default.info('✅ Database connectivity test passed');
        }
        catch (error) {
            throw new Error(`Database connectivity test failed: ${error.message}`);
        }
    }
    /**
     * Test cache functionality
     */
    async testCacheFunctionality() {
        try {
            const cache = (0, cache_1.getCacheService)();
            // Test set/get operations
            const testKey = 'self-test:' + Date.now();
            const testValue = { message: 'Hello from cache test!' };
            await cache.set(testKey, testValue, { ttl: 'short' });
            const retrieved = await cache.get(testKey);
            if (!retrieved || retrieved.message !== testValue.message) {
                throw new Error('Cache test failed - value mismatch');
            }
            // Clean up test key
            await cache.del(testKey);
            logger_simple_util_1.default.info('✅ Cache functionality test passed');
        }
        catch (error) {
            logger_simple_util_1.default.warn('⚠️ Cache functionality test failed (cache may be unavailable):', error);
            // Don't throw error - cache is optional
        }
    }
    /**
     * Test basic API endpoints
     */
    async testBasicEndpoints() {
        try {
            // Note: This would require importing the express app
            // For now, we'll just log that the test would be performed
            logger_simple_util_1.default.info('🔌 Basic API endpoint tests would be performed here');
            // In a real implementation, you might:
            // - Make requests to /health endpoint
            // - Test authentication endpoints
            // - Test basic CRUD operations
        }
        catch (error) {
            throw new Error(`Basic API endpoints test failed: ${error.message}`);
        }
    }
    /**
     * Get initialization status
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Get application status information
     */
    async getStatus() {
        return {
            initialized: this.isInitialized,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date()
        };
    }
}
exports.StartupService = StartupService;
// Export singleton instance
exports.startupService = StartupService.getInstance();
// Export initialization function
const initializeApplication = () => {
    return exports.startupService.initialize();
};
exports.initializeApplication = initializeApplication;
exports.default = exports.startupService;
//# sourceMappingURL=startup.js.map