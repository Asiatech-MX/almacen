"use strict";
/**
 * Punto de entrada principal para los mocks del backend
 * Exporta todos los servicios mock y configura su uso condicional
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockHealthStatus = exports.mockLoggerMiddleware = exports.initializeServices = exports.getStockAdapter = exports.getProveedorAdapter = exports.getMateriaPrimaAdapter = exports.getCacheServiceInstance = exports.getDatabaseService = exports.mockConfig = exports.USE_MOCKS = exports.stockAdapter = exports.mockStockAdapter = exports.proveedorAdapter = exports.mockProveedorAdapter = exports.materiaPrimaAdapter = exports.mockMateriaPrimaAdapter = exports.redisConfig = exports.adminCacheMiddleware = exports.userCacheMiddleware = exports.apiCacheMiddleware = exports.cacheInvalidator = exports.cacheMiddleware = exports.createMockCacheService = exports.getCacheService = exports.MockCacheService = exports.getMockDatabase = exports.getDatabase = void 0;
// Database mocks
var database_mock_1 = require("./database.mock");
Object.defineProperty(exports, "getDatabase", { enumerable: true, get: function () { return database_mock_1.getDatabase; } });
Object.defineProperty(exports, "getMockDatabase", { enumerable: true, get: function () { return database_mock_1.getMockDatabase; } });
// Cache mocks
var cache_mock_1 = require("./cache.mock");
Object.defineProperty(exports, "MockCacheService", { enumerable: true, get: function () { return cache_mock_1.MockCacheService; } });
Object.defineProperty(exports, "getCacheService", { enumerable: true, get: function () { return cache_mock_1.getCacheService; } });
Object.defineProperty(exports, "createMockCacheService", { enumerable: true, get: function () { return cache_mock_1.createMockCacheService; } });
Object.defineProperty(exports, "cacheMiddleware", { enumerable: true, get: function () { return cache_mock_1.cacheMiddleware; } });
Object.defineProperty(exports, "cacheInvalidator", { enumerable: true, get: function () { return cache_mock_1.cacheInvalidator; } });
Object.defineProperty(exports, "apiCacheMiddleware", { enumerable: true, get: function () { return cache_mock_1.apiCacheMiddleware; } });
Object.defineProperty(exports, "userCacheMiddleware", { enumerable: true, get: function () { return cache_mock_1.userCacheMiddleware; } });
Object.defineProperty(exports, "adminCacheMiddleware", { enumerable: true, get: function () { return cache_mock_1.adminCacheMiddleware; } });
Object.defineProperty(exports, "redisConfig", { enumerable: true, get: function () { return cache_mock_1.redisConfig; } });
// Adapter mocks
var materiaPrima_adapter_mock_1 = require("./materiaPrima.adapter.mock");
Object.defineProperty(exports, "mockMateriaPrimaAdapter", { enumerable: true, get: function () { return materiaPrima_adapter_mock_1.mockMateriaPrimaAdapter; } });
Object.defineProperty(exports, "materiaPrimaAdapter", { enumerable: true, get: function () { return materiaPrima_adapter_mock_1.materiaPrimaAdapter; } });
var proveedores_adapter_mock_1 = require("./proveedores.adapter.mock");
Object.defineProperty(exports, "mockProveedorAdapter", { enumerable: true, get: function () { return proveedores_adapter_mock_1.mockProveedorAdapter; } });
Object.defineProperty(exports, "proveedorAdapter", { enumerable: true, get: function () { return proveedores_adapter_mock_1.proveedorAdapter; } });
var stock_adapter_mock_1 = require("./stock.adapter.mock");
Object.defineProperty(exports, "mockStockAdapter", { enumerable: true, get: function () { return stock_adapter_mock_1.mockStockAdapter; } });
Object.defineProperty(exports, "stockAdapter", { enumerable: true, get: function () { return stock_adapter_mock_1.stockAdapter; } });
// Configuration and environment
exports.USE_MOCKS = process.env.USE_MOCKS === 'true' || process.env.NODE_ENV === 'development';
// Mock configuration object
exports.mockConfig = {
    database: {
        useMock: exports.USE_MOCKS,
        delay: 100, // ms to simulate database latency
    },
    cache: {
        useMock: exports.USE_MOCKS,
        defaultTTL: 300, // 5 minutes
        maxSize: 1000, // max number of items in cache
    },
    adapters: {
        useMock: exports.USE_MOCKS,
        delay: 50, // ms to simulate adapter latency
    }
};
/**
 * Factory para obtener el servicio de base de datos apropiado
 */
const getDatabaseService = () => {
    if (exports.mockConfig.database.useMock) {
        console.log('🔧 Using Mock Database Service');
        return getDatabase();
    }
    try {
        // Intentar importar el servicio real
        const { getDatabase: getRealDatabase } = require('../database/database');
        console.log('🗄️ Using Real Database Service');
        return getRealDatabase();
    }
    catch (error) {
        console.warn('⚠️ Real database service not available, falling back to mock:', error);
        return getDatabase();
    }
};
exports.getDatabaseService = getDatabaseService;
/**
 * Factory para obtener el servicio de caché apropiado
 */
const getCacheServiceInstance = () => {
    if (exports.mockConfig.cache.useMock) {
        console.log('🔧 Using Mock Cache Service');
        return getCacheService();
    }
    try {
        // Intentar importar el servicio real
        const { getCacheService: getRealCacheService } = require('../cache');
        console.log('💾 Using Real Cache Service');
        return getRealCacheService();
    }
    catch (error) {
        console.warn('⚠️ Real cache service not available, falling back to mock:', error);
        return getCacheService();
    }
};
exports.getCacheServiceInstance = getCacheServiceInstance;
/**
 * Factory para obtener el adapter de materia prima apropiado
 */
const getMateriaPrimaAdapter = () => {
    if (exports.mockConfig.adapters.useMock) {
        console.log('🔧 Using Mock Materia Prima Adapter');
        return mockMateriaPrimaAdapter;
    }
    try {
        // Intentar importar el adapter real
        const { materiaPrimaAdapter } = require('../adapters/materiaPrima.adapter');
        console.log('📦 Using Real Materia Prima Adapter');
        return materiaPrimaAdapter;
    }
    catch (error) {
        console.warn('⚠️ Real materia prima adapter not available, falling back to mock:', error);
        return mockMateriaPrimaAdapter;
    }
};
exports.getMateriaPrimaAdapter = getMateriaPrimaAdapter;
/**
 * Factory para obtener el adapter de proveedores apropiado
 */
const getProveedorAdapter = () => {
    if (exports.mockConfig.adapters.useMock) {
        console.log('🔧 Using Mock Proveedor Adapter');
        return mockProveedorAdapter;
    }
    try {
        // Intentar importar el adapter real
        const { proveedorAdapter } = require('../adapters/proveedores.adapter');
        console.log('🏢 Using Real Proveedor Adapter');
        return proveedorAdapter;
    }
    catch (error) {
        console.warn('⚠️ Real proveedor adapter not available, falling back to mock:', error);
        return mockProveedorAdapter;
    }
};
exports.getProveedorAdapter = getProveedorAdapter;
/**
 * Factory para obtener el adapter de stock apropiado
 */
const getStockAdapter = () => {
    if (exports.mockConfig.adapters.useMock) {
        console.log('🔧 Using Mock Stock Adapter');
        return mockStockAdapter;
    }
    try {
        // Intentar importar el adapter real
        const { stockAdapter } = require('../adapters/stock.adapter');
        console.log('📊 Using Real Stock Adapter');
        return stockAdapter;
    }
    catch (error) {
        console.warn('⚠️ Real stock adapter not available, falling back to mock:', error);
        return mockStockAdapter;
    }
};
exports.getStockAdapter = getStockAdapter;
/**
 * Inicializa los servicios con los valores apropiados (mock o real)
 */
const initializeServices = () => {
    console.log('🚀 Initializing Backend Services...');
    console.log(`📋 Mock Mode: ${exports.USE_MOCKS ? 'ENABLED' : 'DISABLED'}`);
    // Pre-warm the factories to load modules early
    (0, exports.getDatabaseService)();
    (0, exports.getCacheServiceInstance)();
    (0, exports.getMateriaPrimaAdapter)();
    (0, exports.getProveedorAdapter)();
    (0, exports.getStockAdapter)();
    console.log('✅ Backend Services Initialized Successfully');
    return {
        database: (0, exports.getDatabaseService)(),
        cache: (0, exports.getCacheServiceInstance)(),
        materiaPrimaAdapter: (0, exports.getMateriaPrimaAdapter)(),
        proveedorAdapter: (0, exports.getProveedorAdapter)(),
        stockAdapter: (0, exports.getStockAdapter)(),
        config: exports.mockConfig
    };
};
exports.initializeServices = initializeServices;
/**
 * Middleware para logging de requests en modo mock
 */
const mockLoggerMiddleware = (req, res, next) => {
    if (exports.USE_MOCKS) {
        const timestamp = new Date().toISOString();
        console.log(`🔧 [${timestamp}] ${req.method} ${req.originalUrl} (Mock Mode)`);
    }
    next();
};
exports.mockLoggerMiddleware = mockLoggerMiddleware;
/**
 * Health check para servicios mock
 */
const getMockHealthStatus = async () => {
    if (!exports.USE_MOCKS) {
        return { mock: false };
    }
    try {
        const cacheService = (0, exports.getCacheServiceInstance)();
        const cacheHealth = await cacheService.healthCheck();
        return {
            mock: true,
            database: 'healthy', // Mock database is always healthy
            cache: cacheHealth ? 'healthy' : 'unhealthy',
            adapters: 'healthy', // Mock adapters are always healthy
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            mock: true,
            database: 'healthy',
            cache: 'unhealthy',
            adapters: 'healthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
};
exports.getMockHealthStatus = getMockHealthStatus;
exports.default = {
    USE_MOCKS: exports.USE_MOCKS,
    mockConfig: exports.mockConfig,
    initializeServices: exports.initializeServices,
    getDatabaseService: exports.getDatabaseService,
    getCacheServiceInstance: exports.getCacheServiceInstance,
    getMateriaPrimaAdapter: exports.getMateriaPrimaAdapter,
    getProveedorAdapter: exports.getProveedorAdapter,
    getStockAdapter: exports.getStockAdapter,
    mockLoggerMiddleware: exports.mockLoggerMiddleware,
    getMockHealthStatus: exports.getMockHealthStatus
};
//# sourceMappingURL=index.js.map