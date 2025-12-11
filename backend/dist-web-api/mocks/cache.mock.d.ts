/**
 * Mock Cache Service para desarrollo y testing
 * Implementa una simulación de las operaciones de caché Redis
 */
export interface CacheOptions {
    ttl?: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
}
export interface MockCacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    keys(pattern?: string): Promise<string[]>;
    flushAll(): Promise<void>;
    healthCheck(): Promise<boolean>;
    getStats(): Promise<CacheStats>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
}
export declare class MockCacheService implements MockCacheService {
    private cache;
    private stats;
    setWithPattern(pattern: string, value: any, options?: CacheOptions): Promise<void>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset<T>(items: {
        key: string;
        value: T;
        options?: CacheOptions;
    }[]): Promise<void>;
    expire(key: string, ttl: number): Promise<void>;
    ttl(key: string): Promise<number>;
}
export declare const getCacheService: () => MockCacheService;
export declare const createMockCacheService: () => MockCacheService;
export interface CacheMiddlewareOptions {
    ttl?: number;
    keyGenerator?: (req: any) => string;
    condition?: (req: any) => boolean;
    skipCache?: (req: any) => boolean;
}
export declare const cacheMiddleware: (options?: CacheMiddlewareOptions) => (req: any, res: any, next: any) => Promise<any>;
export declare const cacheInvalidator: (pattern: string) => (req: any, res: any, next: any) => Promise<void>;
export declare const apiCacheMiddleware: (req: any, res: any, next: any) => Promise<any>;
export declare const userCacheMiddleware: (req: any, res: any, next: any) => Promise<any>;
export declare const adminCacheMiddleware: (req: any, res: any, next: any) => Promise<any>;
export declare const redisConfig: {
    host: string;
    port: number;
    password: undefined;
    db: number;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    lazyConnect: boolean;
    keepAlive: number;
    connectTimeout: number;
    commandTimeout: number;
    keyPrefix: string;
    reconnectOnError: (err: Error) => boolean;
    cluster: undefined;
};
//# sourceMappingURL=cache.mock.d.ts.map