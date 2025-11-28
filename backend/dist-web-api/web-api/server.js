"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
// Import mocks with conditional loading
const mocks_1 = require("../mocks");
// Try to import real services, fallback to mocks if not available
let getDatabase, getConnectionPool, getCacheService, cacheMiddleware, cacheInvalidator, apiCacheMiddleware;
let errorHandler;
if (!mocks_1.USE_MOCKS) {
    try {
        const db = require('../database/connection');
        getDatabase = db.getDatabase;
        getConnectionPool = db.getConnectionPool;
        const cache = require('../cache');
        getCacheService = cache.getCacheService;
        cacheMiddleware = cache.cacheMiddleware;
        cacheInvalidator = cache.cacheInvalidator;
        apiCacheMiddleware = cache.apiCacheMiddleware;
        errorHandler = require('./middleware/errorHandler').errorHandler;
        console.log('🗄️ Real services loaded successfully');
    }
    catch (error) {
        console.warn('⚠️ Real services not available, using mocks:', error);
        // Force mock mode if real services are not available
        process.env.USE_MOCKS = 'true';
    }
}
// Use mock services if in mock mode or if real services failed to load
if (mocks_1.USE_MOCKS || !getDatabase) {
    const services = (0, mocks_1.initializeServices)();
    getDatabase = () => services.database;
    getCacheService = () => services.cache;
    cacheMiddleware = (options) => services.cacheMiddleware(options);
    cacheInvalidator = (patterns) => services.cacheInvalidator(patterns);
    apiCacheMiddleware = () => services.apiCacheMiddleware;
    // Mock error handler
    errorHandler = (err, req, res, next) => {
        console.error('Mock Error Handler:', err);
        res.status(err.status || 500).json({
            success: false,
            error: err.message || 'Internal Server Error',
            timestamp: new Date().toISOString(),
            mock: true
        });
    };
    console.log('🔧 Mock services initialized');
}
// Configuración de CORS simplificada para desarrollo
const corsOptions = {
    origin: [
        'http://localhost:5173', // Vite dev server
        'http://localhost:5174', // Vite dev server alt
        'http://localhost:5175', // Vite dev server actual
        'http://localhost:3000', // React dev server
        'http://localhost:3001', // Web API server
        /^chrome-extension:\/\//, // Chrome extensions
        /^devtools:\/\//, // Chrome DevTools
    ],
    credentials: true, // Permitir cookies y credenciales
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // Cache preflight por 24 horas
    optionsSuccessStatus: 200, // Para compatibilidad con navegadores antiguos
    preflightContinue: false // Manejar preflight requests
};
// Configuración de Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // límite de requests por ventana
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info en headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    // Skip rate limiting para desarrollo
    skip: (req) => process.env.NODE_ENV !== 'production'
});
// Crear aplicación Express
const app = (0, express_1.default)();
// Middlewares de seguridad y configuración
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:*", "https://localhost:*"],
        },
    },
    crossOriginEmbedderPolicy: false // Necesario para Chrome DevTools
}));
app.use((0, compression_1.default)()); // Comprimir respuestas
app.use(express_1.default.json({ limit: '10mb' })); // Parsear JSON
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Parsear form data
// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined')); // Logging detallado en producción
}
else {
    app.use((0, morgan_1.default)('dev')); // Logging conciso en desarrollo
}
// CORS y Rate Limiting
app.use((0, cors_1.default)(corsOptions));
app.use('/api', limiter); // Aplicar rate limiting solo a endpoints de API
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    try {
        if (mocks_1.USE_MOCKS || !getConnectionPool) {
            // Use mock health check
            const mockHealth = await (0, mocks_1.getMockHealthStatus)();
            const cache = getCacheService();
            const cacheStats = await cache.getStats();
            return res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                cache: mockHealth.cache === 'healthy' ? 'connected' : 'disconnected',
                connectionPool: 'healthy',
                environment: process.env.NODE_ENV || 'development',
                mock: true,
                performance: {
                    cache: {
                        hitRate: cacheStats.hitRate,
                        totalKeys: cacheStats.totalKeys,
                        memoryUsage: cacheStats.memoryUsage
                    },
                    database: {
                        totalConnections: 1,
                        idleConnections: 0,
                        activeConnections: 1
                    }
                }
            });
        }
        // Real services health check
        const db = getDatabase();
        const cache = getCacheService();
        const pool = getConnectionPool();
        // Check database
        await db.selectFrom('proveedor').select('id').limit(1).execute();
        // Check cache
        const cacheHealth = await cache.healthCheck();
        const cacheStats = await cache.getStats();
        // Check connection pool
        const poolHealth = await pool.healthCheck();
        const poolStats = pool.getStats();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            cache: cacheHealth ? 'connected' : 'disconnected',
            connectionPool: poolHealth ? 'healthy' : 'unhealthy',
            environment: process.env.NODE_ENV || 'development',
            mock: false,
            performance: {
                cache: {
                    hitRate: cacheStats.hitRate,
                    totalKeys: cacheStats.totalKeys,
                    memoryUsage: cacheStats.memoryUsage
                },
                database: {
                    totalConnections: poolStats.totalConnections,
                    idleConnections: poolStats.idleCount,
                    activeConnections: poolStats.activeCount
                }
            }
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            mock: mocks_1.USE_MOCKS || false
        });
    }
});
// Apply caching middleware for read operations
app.use('/api/materiaPrima/stats', cacheMiddleware({ ttl: 'stats' }));
app.use('/api/materiaPrima/stock-bajo', cacheMiddleware({ ttl: 'short' }));
app.use('/api/materiaPrima/*', cacheInvalidator(['materiaPrima:*', 'stats:*']));
// Enable pre-flight requests for all routes (required for PATCH/PUT/DELETE)
app.options('*', (0, cors_1.default)()); // enable pre-flight request for PATCH/PUT/DELETE
// API Routes
const materiaPrima_routes_1 = require("./routes/materiaPrima.routes");
const proveedores_routes_1 = require("./routes/proveedores.routes");
const stockRoutes_1 = require("./routes/stockRoutes");
app.use('/api/materiaPrima', materiaPrima_routes_1.materiaPrimaRoutes);
app.use('/api/proveedores', proveedores_routes_1.proveedorRoutes);
app.use('/api/stock', stockRoutes_1.stockRoutes);
// Cache performance monitoring endpoint
app.get('/cache/stats', async (req, res) => {
    try {
        const cache = getCacheService();
        const stats = await cache.getStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
            mock: mocks_1.USE_MOCKS || false
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            mock: mocks_1.USE_MOCKS || false
        });
    }
});
// Database performance monitoring endpoint
app.get('/db/stats', async (req, res) => {
    try {
        if (mocks_1.USE_MOCKS || !getConnectionPool) {
            // Return mock database stats
            return res.json({
                success: true,
                data: {
                    pool: {
                        totalConnections: 1,
                        idleCount: 0,
                        activeCount: 1,
                        waitingCount: 0
                    },
                    slowQueries: [
                        {
                            query: 'SELECT * FROM materia_prima LIMIT 10',
                            executionTime: 45,
                            timestamp: new Date().toISOString()
                        }
                    ]
                },
                timestamp: new Date().toISOString(),
                mock: true
            });
        }
        const pool = getConnectionPool();
        const poolStats = pool.getStats();
        const slowQueries = pool.getSlowQueries(1000, 10);
        res.json({
            success: true,
            data: {
                pool: poolStats,
                slowQueries: slowQueries.map(q => ({
                    query: q.query,
                    executionTime: q.executionTime,
                    timestamp: q.timestamp
                }))
            },
            timestamp: new Date().toISOString(),
            mock: false
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            mock: mocks_1.USE_MOCKS || false
        });
    }
});
// Clear cache endpoint (admin only)
app.post('/cache/clear', async (req, res) => {
    try {
        const { patterns } = req.body;
        if (!patterns || !Array.isArray(patterns)) {
            return res.status(400).json({
                success: false,
                error: 'Patterns array is required'
            });
        }
        const cache = getCacheService();
        if (mocks_1.USE_MOCKS || typeof cache.invalidatePatterns !== 'function') {
            // Mock cache clearing - just clear everything
            await cache.flushAll();
        }
        else {
            await cache.invalidatePatterns(patterns);
        }
        res.json({
            success: true,
            message: mocks_1.USE_MOCKS
                ? 'Mock cache cleared successfully'
                : `Cache cleared for patterns: ${patterns.join(', ')}`,
            timestamp: new Date().toISOString(),
            mock: mocks_1.USE_MOCKS || false
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            mock: mocks_1.USE_MOCKS || false
        });
    }
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use(errorHandler);
// Función para iniciar servidor
function startServer(port = 3013) {
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`🚀 Web API Server running on port ${port}`);
            console.log(`📍 Health check: http://localhost:${port}/health`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS enabled for Chrome DevTools`);
            resolve();
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use`);
                reject(new Error(`Port ${port} is already in use`));
            }
            else {
                console.error('❌ Server error:', err);
                reject(err);
            }
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            console.log('🛑 SIGINT received, shutting down gracefully');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
    });
}
// Exportar app para testing
exports.default = app;
//# sourceMappingURL=server.js.map