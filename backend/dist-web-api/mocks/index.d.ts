/**
 * Punto de entrada principal para los mocks del backend
 * Exporta todos los servicios mock y configura su uso condicional
 */
export { getDatabase, getMockDatabase } from './database.mock';
export type { MockDB, MockQueryBuilder, MockInsertBuilder, MockUpdateBuilder, MockDeleteBuilder } from './database.mock';
export { MockCacheService, getCacheService, createMockCacheService, cacheMiddleware, cacheInvalidator, apiCacheMiddleware, userCacheMiddleware, adminCacheMiddleware, redisConfig } from './cache.mock';
export type { CacheOptions, CacheStats, MockCacheService as ICacheService, CacheMiddlewareOptions } from './cache.mock';
export { mockMateriaPrimaAdapter, materiaPrimaAdapter } from './materiaPrima.adapter.mock';
export type { MateriaPrimaAdapter, MateriaPrimaAdapterResponse } from './materiaPrima.adapter.mock';
export { mockProveedorAdapter, proveedorAdapter } from './proveedores.adapter.mock';
export type { ProveedorAdapter, ProveedorAdapterResponse } from './proveedores.adapter.mock';
export { mockStockAdapter, stockAdapter } from './stock.adapter.mock';
export type { StockAdapter, StockAdapterResponse } from './stock.adapter.mock';
export declare const USE_MOCKS: boolean;
export declare const mockConfig: {
    database: {
        useMock: boolean;
        delay: number;
    };
    cache: {
        useMock: boolean;
        defaultTTL: number;
        maxSize: number;
    };
    adapters: {
        useMock: boolean;
        delay: number;
    };
};
/**
 * Factory para obtener el servicio de base de datos apropiado
 */
export declare const getDatabaseService: () => any;
/**
 * Factory para obtener el servicio de caché apropiado
 */
export declare const getCacheServiceInstance: () => any;
/**
 * Factory para obtener el adapter de materia prima apropiado
 */
export declare const getMateriaPrimaAdapter: () => any;
/**
 * Factory para obtener el adapter de proveedores apropiado
 */
export declare const getProveedorAdapter: () => any;
/**
 * Factory para obtener el adapter de stock apropiado
 */
export declare const getStockAdapter: () => any;
/**
 * Inicializa los servicios con los valores apropiados (mock o real)
 */
export declare const initializeServices: () => {
    database: any;
    cache: any;
    materiaPrimaAdapter: any;
    proveedorAdapter: any;
    stockAdapter: any;
    config: {
        database: {
            useMock: boolean;
            delay: number;
        };
        cache: {
            useMock: boolean;
            defaultTTL: number;
            maxSize: number;
        };
        adapters: {
            useMock: boolean;
            delay: number;
        };
    };
};
/**
 * Middleware para logging de requests en modo mock
 */
export declare const mockLoggerMiddleware: (req: any, res: any, next: any) => void;
/**
 * Health check para servicios mock
 */
export declare const getMockHealthStatus: () => Promise<{
    mock: boolean;
    database?: undefined;
    cache?: undefined;
    adapters?: undefined;
    timestamp?: undefined;
    error?: undefined;
} | {
    mock: boolean;
    database: string;
    cache: string;
    adapters: string;
    timestamp: string;
    error?: undefined;
} | {
    mock: boolean;
    database: string;
    cache: string;
    adapters: string;
    error: string;
    timestamp: string;
}>;
declare const _default: {
    USE_MOCKS: boolean;
    mockConfig: {
        database: {
            useMock: boolean;
            delay: number;
        };
        cache: {
            useMock: boolean;
            defaultTTL: number;
            maxSize: number;
        };
        adapters: {
            useMock: boolean;
            delay: number;
        };
    };
    initializeServices: () => {
        database: any;
        cache: any;
        materiaPrimaAdapter: any;
        proveedorAdapter: any;
        stockAdapter: any;
        config: {
            database: {
                useMock: boolean;
                delay: number;
            };
            cache: {
                useMock: boolean;
                defaultTTL: number;
                maxSize: number;
            };
            adapters: {
                useMock: boolean;
                delay: number;
            };
        };
    };
    getDatabaseService: () => any;
    getCacheServiceInstance: () => any;
    getMateriaPrimaAdapter: () => any;
    getProveedorAdapter: () => any;
    getStockAdapter: () => any;
    mockLoggerMiddleware: (req: any, res: any, next: any) => void;
    getMockHealthStatus: () => Promise<{
        mock: boolean;
        database?: undefined;
        cache?: undefined;
        adapters?: undefined;
        timestamp?: undefined;
        error?: undefined;
    } | {
        mock: boolean;
        database: string;
        cache: string;
        adapters: string;
        timestamp: string;
        error?: undefined;
    } | {
        mock: boolean;
        database: string;
        cache: string;
        adapters: string;
        error: string;
        timestamp: string;
    }>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map