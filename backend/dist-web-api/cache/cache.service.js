"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
exports.getCacheService = getCacheService;
const ioredis_1 = __importStar(require("ioredis"));
const redis_config_1 = require("./redis.config");
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
/**
 * Servicio de caché distribuido con Redis
 * Soporta clustering, compresión y estadísticas
 */
class CacheService {
    constructor() {
        this.client = null;
        this.isHealthy = false;
        this.stats = {
            hits: 0,
            misses: 0
        };
        this.initialize();
    }
    /**
     * Inicializar conexión a Redis
     */
    async initialize() {
        try {
            if (redis_config_1.redisConfig.cluster.enabled && redis_config_1.redisConfig.cluster.nodes.length > 0) {
                // Configuración para cluster
                this.client = new ioredis_1.Cluster(redis_config_1.redisConfig.cluster.nodes, {
                    redisOptions: {
                        password: redis_config_1.redisConfig.password,
                        connectTimeout: redis_config_1.redisConfig.connectTimeout,
                        commandTimeout: redis_config_1.redisConfig.commandTimeout,
                        maxRetriesPerRequest: redis_config_1.redisConfig.maxRetriesPerRequest,
                        lazyConnect: redis_config_1.redisConfig.lazyConnect,
                        keepAlive: redis_config_1.redisConfig.keepAlive,
                        keyPrefix: redis_config_1.redisConfig.keyPrefix
                    },
                    retryDelayOnFailover: redis_config_1.redisConfig.retryDelayOnFailover
                });
            }
            else {
                // Configuración para instancia única
                this.client = new ioredis_1.default({
                    host: redis_config_1.redisConfig.host,
                    port: redis_config_1.redisConfig.port,
                    password: redis_config_1.redisConfig.password,
                    db: redis_config_1.redisConfig.database,
                    maxRetriesPerRequest: redis_config_1.redisConfig.maxRetriesPerRequest,
                    retryDelayOnFailover: redis_config_1.redisConfig.retryDelayOnFailover,
                    lazyConnect: redis_config_1.redisConfig.lazyConnect,
                    keepAlive: redis_config_1.redisConfig.keepAlive,
                    connectTimeout: redis_config_1.redisConfig.connectTimeout,
                    commandTimeout: redis_config_1.redisConfig.commandTimeout,
                    keyPrefix: redis_config_1.redisConfig.keyPrefix,
                    reconnectOnError: (err) => {
                        const targetError = 'READONLY';
                        return err.message.includes(targetError);
                    }
                });
            }
            // Event listeners
            this.client.on('connect', () => {
                logger_simple_util_1.default.info('✅ Redis connected successfully');
                this.isHealthy = true;
            });
            this.client.on('ready', () => {
                logger_simple_util_1.default.info('🚀 Redis ready for commands');
                this.isHealthy = true;
            });
            this.client.on('error', (error) => {
                logger_simple_util_1.default.error('❌ Redis connection error:', error);
                this.isHealthy = false;
            });
            this.client.on('close', () => {
                logger_simple_util_1.default.warn('⚠️ Redis connection closed');
                this.isHealthy = false;
            });
            this.client.on('reconnecting', () => {
                logger_simple_util_1.default.info('🔄 Redis reconnecting...');
            });
            // Probar conexión
            await this.client.ping();
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Failed to initialize Redis:', error);
            this.isHealthy = false;
        }
    }
    /**
     * Obtener cliente Redis (con verificación de salud)
     */
    getClient() {
        if (!this.client || !this.isHealthy) {
            throw new Error('Redis client not available or unhealthy');
        }
        return this.client;
    }
    /**
     * Generar TTL en segundos basado en configuración
     */
    getTTL(ttl) {
        if (typeof ttl === 'number') {
            return ttl;
        }
        return redis_config_1.redisConfig.ttl[ttl || 'default'];
    }
    /**
     * Serializar valor para caché
     */
    serialize(value, compress = false) {
        let serialized;
        if (typeof value === 'object') {
            serialized = JSON.stringify(value);
        }
        else {
            serialized = String(value);
        }
        // Future: Implementar compresión si compress = true
        return serialized;
    }
    /**
     * Deserializar valor desde caché
     */
    deserialize(value, parseJson = false) {
        if (parseJson) {
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return value;
    }
    /**
     * Almacenar valor en caché
     */
    async set(key, value, options = {}) {
        try {
            const client = this.getClient();
            const ttl = this.getTTL(options.ttl);
            const serialized = this.serialize(value, options.compress);
            if (ttl > 0) {
                await client.setex(key, ttl, serialized);
            }
            else {
                await client.set(key, serialized);
            }
            logger_simple_util_1.default.debug(`📦 Cached key: ${key} (TTL: ${ttl}s)`);
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache set failed for key ${key}:`, error);
            // No lanzar error para no afectar la operación principal
        }
    }
    /**
     * Obtener valor desde caché
     */
    async get(key, options = {}) {
        try {
            const client = this.getClient();
            const value = await client.get(key);
            if (value === null) {
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            const deserialized = this.deserialize(value, options.json);
            logger_simple_util_1.default.debug(`📥 Cache hit: ${key}`);
            return deserialized;
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache get failed for key ${key}:`, error);
            this.stats.misses++;
            return null;
        }
    }
    /**
     * Eliminar clave de caché
     */
    async del(key) {
        try {
            const client = this.getClient();
            await client.del(key);
            logger_simple_util_1.default.debug(`🗑️ Cache deleted: ${key}`);
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache delete failed for key ${key}:`, error);
        }
    }
    /**
     * Verificar si existe clave en caché
     */
    async exists(key) {
        try {
            const client = this.getClient();
            const result = await client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache exists check failed for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Establecer TTL para clave existente
     */
    async expire(key, ttl) {
        try {
            const client = this.getClient();
            await client.expire(key, ttl);
            logger_simple_util_1.default.debug(`⏰ Cache TTL set: ${key} (${ttl}s)`);
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache expire failed for key ${key}:`, error);
        }
    }
    /**
     * Obtener TTL restante de clave
     */
    async ttl(key) {
        try {
            const client = this.getClient();
            return await client.ttl(key);
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache TTL check failed for key ${key}:`, error);
            return -1;
        }
    }
    /**
     * Limpiar caché por patrón
     */
    async clearPattern(pattern) {
        try {
            const client = this.getClient();
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
                logger_simple_util_1.default.info(`🧹 Cache cleared: ${keys.length} keys matching "${pattern}"`);
            }
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache pattern clear failed for "${pattern}":`, error);
        }
    }
    /**
     * Incrementar valor numérico
     */
    async incr(key, amount = 1) {
        try {
            const client = this.getClient();
            return await client.incrby(key, amount);
        }
        catch (error) {
            logger_simple_util_1.default.warn(`⚠️ Cache increment failed for key ${key}:`, error);
            return 0;
        }
    }
    /**
     * Cache con memoización (función costosa)
     */
    async memoize(key, fn, options = {}) {
        // Intentar obtener desde caché
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        // Ejecutar función y cachear resultado
        const result = await fn();
        await this.set(key, result, options);
        return result;
    }
    /**
     * Invalidación múltiple por patrones
     */
    async invalidatePatterns(patterns) {
        await Promise.all(patterns.map(pattern => this.clearPattern(pattern)));
    }
    /**
     * Health check de Redis
     */
    async healthCheck() {
        try {
            if (!this.client) {
                return false;
            }
            await this.client.ping();
            this.isHealthy = true;
            return true;
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Redis health check failed:', error);
            this.isHealthy = false;
            return false;
        }
    }
    /**
     * Obtener estadísticas de caché
     */
    async getStats() {
        try {
            const client = this.getClient();
            const info = await client.info('memory');
            const keyspace = await client.info('keyspace');
            // Parsear información de memoria
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';
            // Contar claves
            let totalKeys = 0;
            const dbMatches = keyspace.match(/db\d+:(.+)/g);
            if (dbMatches) {
                dbMatches.forEach(db => {
                    const match = db.match(/keys=(\d+)/);
                    if (match) {
                        totalKeys += parseInt(match[1], 10);
                    }
                });
            }
            const totalRequests = this.stats.hits + this.stats.misses;
            const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: Math.round(hitRate * 100) / 100,
                totalKeys,
                memoryUsage
            };
        }
        catch (error) {
            logger_simple_util_1.default.warn('⚠️ Failed to get cache stats:', error);
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: 'unknown'
            };
        }
    }
    /**
     * Limpiar todas las claves (con cuidado)
     */
    async flushAll() {
        try {
            const client = this.getClient();
            await client.flushdb();
            logger_simple_util_1.default.warn('⚠️ Cache flushed: all keys cleared');
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Cache flush failed:', error);
        }
    }
    /**
     * Cerrar conexión
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isHealthy = false;
            logger_simple_util_1.default.info('🔌 Redis connection closed');
        }
    }
}
exports.CacheService = CacheService;
// Singleton instance
let cacheService = null;
function getCacheService() {
    if (!cacheService) {
        cacheService = new CacheService();
    }
    return cacheService;
}
exports.default = CacheService;
//# sourceMappingURL=cache.service.js.map