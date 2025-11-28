export type CacheTTL = 'default' | 'short' | 'medium' | 'long' | 'stats';
export interface CacheOptions {
    ttl?: CacheTTL | number;
    compress?: boolean;
    json?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
}
/**
 * Servicio de caché distribuido con Redis
 * Soporta clustering, compresión y estadísticas
 */
export declare class CacheService {
    private client;
    private isHealthy;
    private stats;
    constructor();
    /**
     * Inicializar conexión a Redis
     */
    private initialize;
    /**
     * Obtener cliente Redis (con verificación de salud)
     */
    private getClient;
    /**
     * Generar TTL en segundos basado en configuración
     */
    private getTTL;
    /**
     * Serializar valor para caché
     */
    private serialize;
    /**
     * Deserializar valor desde caché
     */
    private deserialize;
    /**
     * Almacenar valor en caché
     */
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    /**
     * Obtener valor desde caché
     */
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    /**
     * Eliminar clave de caché
     */
    del(key: string): Promise<void>;
    /**
     * Verificar si existe clave en caché
     */
    exists(key: string): Promise<boolean>;
    /**
     * Establecer TTL para clave existente
     */
    expire(key: string, ttl: number): Promise<void>;
    /**
     * Obtener TTL restante de clave
     */
    ttl(key: string): Promise<number>;
    /**
     * Limpiar caché por patrón
     */
    clearPattern(pattern: string): Promise<void>;
    /**
     * Incrementar valor numérico
     */
    incr(key: string, amount?: number): Promise<number>;
    /**
     * Cache con memoización (función costosa)
     */
    memoize<T>(key: string, fn: () => Promise<T>, options?: CacheOptions): Promise<T>;
    /**
     * Invalidación múltiple por patrones
     */
    invalidatePatterns(patterns: string[]): Promise<void>;
    /**
     * Health check de Redis
     */
    healthCheck(): Promise<boolean>;
    /**
     * Obtener estadísticas de caché
     */
    getStats(): Promise<CacheStats>;
    /**
     * Limpiar todas las claves (con cuidado)
     */
    flushAll(): Promise<void>;
    /**
     * Cerrar conexión
     */
    disconnect(): Promise<void>;
}
export declare function getCacheService(): CacheService;
export default CacheService;
//# sourceMappingURL=cache.service.d.ts.map