/**
 * Punto de entrada principal para los mocks del backend
 * Exporta todos los servicios mock y configura su uso condicional
 */

// Database mocks
export { getDatabase, getMockDatabase } from './database.mock';
export type { MockDB, MockQueryBuilder, MockInsertBuilder, MockUpdateBuilder, MockDeleteBuilder } from './database.mock';

// Cache mocks
export {
  MockCacheService,
  getCacheService,
  createMockCacheService,
  cacheMiddleware,
  cacheInvalidator,
  apiCacheMiddleware,
  userCacheMiddleware,
  adminCacheMiddleware,
  redisConfig
} from './cache.mock';
export type { CacheOptions, CacheStats, MockCacheService as ICacheService, CacheMiddlewareOptions } from './cache.mock';

// Adapter mocks
export { materiaPrimaAdapter as mockMateriaPrimaAdapter } from './materiaPrima.adapter.mock';
export type { MateriaPrimaAdapter, MateriaPrimaAdapterResponse } from './materiaPrima.adapter.mock';

export { proveedorAdapter as mockProveedorAdapter } from './proveedores.adapter.mock';
export type { ProveedorAdapter, ProveedorAdapterResponse } from './proveedores.adapter.mock';

export { stockAdapter as mockStockAdapter } from './stock.adapter.mock';
export type { StockAdapter, StockAdapterResponse } from './stock.adapter.mock';

// Configuration and environment
export const USE_MOCKS = process.env.USE_MOCKS === 'true' || process.env.NODE_ENV === 'development';

// Mock configuration object
export const mockConfig = {
  database: {
    useMock: USE_MOCKS,
    delay: 100, // ms to simulate database latency
  },
  cache: {
    useMock: USE_MOCKS,
    defaultTTL: 300, // 5 minutes
    maxSize: 1000, // max number of items in cache
  },
  adapters: {
    useMock: USE_MOCKS,
    delay: 50, // ms to simulate adapter latency
  }
};

/**
 * Factory para obtener el servicio de base de datos apropiado
 */
export const getDatabaseService = () => {
  if (mockConfig.database.useMock) {
    console.log('🔧 Using Mock Database Service');
    return getDatabase();
  }

  try {
    // Intentar importar el servicio real
    const { getDatabase: getRealDatabase } = require('../database/database');
    console.log('🗄️ Using Real Database Service');
    return getRealDatabase();
  } catch (error) {
    console.warn('⚠️ Real database service not available, falling back to mock:', error);
    return getDatabase();
  }
};

/**
 * Factory para obtener el servicio de caché apropiado
 */
export const getCacheServiceInstance = () => {
  if (mockConfig.cache.useMock) {
    console.log('🔧 Using Mock Cache Service');
    return getCacheService();
  }

  try {
    // Intentar importar el servicio real
    const { getCacheService: getRealCacheService } = require('../cache');
    console.log('💾 Using Real Cache Service');
    return getRealCacheService();
  } catch (error) {
    console.warn('⚠️ Real cache service not available, falling back to mock:', error);
    return getCacheService();
  }
};

/**
 * Factory para obtener el adapter de materia prima apropiado
 */
export const getMateriaPrimaAdapter = () => {
  if (mockConfig.adapters.useMock) {
    console.log('🔧 Using Mock Materia Prima Adapter');
    return mockMateriaPrimaAdapter;
  }

  try {
    // Intentar importar el adapter real
    const { materiaPrimaAdapter } = require('../adapters/materiaPrima.adapter');
    console.log('📦 Using Real Materia Prima Adapter');
    return materiaPrimaAdapter;
  } catch (error) {
    console.warn('⚠️ Real materia prima adapter not available, falling back to mock:', error);
    return mockMateriaPrimaAdapter;
  }
};

/**
 * Factory para obtener el adapter de proveedores apropiado
 */
export const getProveedorAdapter = () => {
  if (mockConfig.adapters.useMock) {
    console.log('🔧 Using Mock Proveedor Adapter');
    return mockProveedorAdapter;
  }

  try {
    // Intentar importar el adapter real
    const { proveedorAdapter } = require('../adapters/proveedores.adapter');
    console.log('🏢 Using Real Proveedor Adapter');
    return proveedorAdapter;
  } catch (error) {
    console.warn('⚠️ Real proveedor adapter not available, falling back to mock:', error);
    return mockProveedorAdapter;
  }
};

/**
 * Factory para obtener el adapter de stock apropiado
 */
export const getStockAdapter = () => {
  if (mockConfig.adapters.useMock) {
    console.log('🔧 Using Mock Stock Adapter');
    return mockStockAdapter;
  }

  try {
    // Intentar importar el adapter real
    const { stockAdapter } = require('../adapters/stock.adapter');
    console.log('📊 Using Real Stock Adapter');
    return stockAdapter;
  } catch (error) {
    console.warn('⚠️ Real stock adapter not available, falling back to mock:', error);
    return mockStockAdapter;
  }
};

/**
 * Inicializa los servicios con los valores apropiados (mock o real)
 */
export const initializeServices = () => {
  console.log('🚀 Initializing Backend Services...');
  console.log(`📋 Mock Mode: ${USE_MOCKS ? 'ENABLED' : 'DISABLED'}`);

  // Pre-warm the factories to load modules early
  getDatabaseService();
  getCacheServiceInstance();
  getMateriaPrimaAdapter();
  getProveedorAdapter();
  getStockAdapter();

  console.log('✅ Backend Services Initialized Successfully');

  return {
    database: getDatabaseService(),
    cache: getCacheServiceInstance(),
    materiaPrimaAdapter: getMateriaPrimaAdapter(),
    proveedorAdapter: getProveedorAdapter(),
    stockAdapter: getStockAdapter(),
    config: mockConfig
  };
};

/**
 * Middleware para logging de requests en modo mock
 */
export const mockLoggerMiddleware = (req: any, res: any, next: any) => {
  if (USE_MOCKS) {
    const timestamp = new Date().toISOString();
    console.log(`🔧 [${timestamp}] ${req.method} ${req.originalUrl} (Mock Mode)`);
  }
  next();
};

/**
 * Health check para servicios mock
 */
export const getMockHealthStatus = async () => {
  if (!USE_MOCKS) {
    return { mock: false };
  }

  try {
    const cacheService = getCacheServiceInstance();
    const cacheHealth = await cacheService.healthCheck();

    return {
      mock: true,
      database: 'healthy', // Mock database is always healthy
      cache: cacheHealth ? 'healthy' : 'unhealthy',
      adapters: 'healthy', // Mock adapters are always healthy
      timestamp: new Date().toISOString()
    };
  } catch (error) {
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

export default {
  USE_MOCKS,
  mockConfig,
  initializeServices,
  getDatabaseService,
  getCacheServiceInstance,
  getMateriaPrimaAdapter,
  getProveedorAdapter,
  getStockAdapter,
  mockLoggerMiddleware,
  getMockHealthStatus
};