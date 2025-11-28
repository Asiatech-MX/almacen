"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMiddleware = cacheMiddleware;
exports.cacheInvalidator = cacheInvalidator;
exports.apiCacheMiddleware = apiCacheMiddleware;
exports.userCacheMiddleware = userCacheMiddleware;
exports.adminCacheMiddleware = adminCacheMiddleware;
const cache_service_1 = require("./cache.service");
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
/**
 * Middleware para caché de respuestas HTTP
 * Almacena respuestas GET en Redis con configuración flexible
 */
function cacheMiddleware(options = {}) {
    const { keyGenerator = defaultKeyGenerator, ttl = 'medium', condition = defaultCondition, compress = false, vary = [], skipMethods = ['POST', 'PUT', 'DELETE', 'PATCH'] } = options;
    return async (req, res, next) => {
        try {
            // Verificar si se debe saltar caché
            if (skipMethods.includes(req.method) || !condition(req)) {
                return next();
            }
            const cache = (0, cache_service_1.getCacheService)();
            const key = keyGenerator(req);
            // Intentar obtener desde caché
            const cached = await cache.get(key, { json: true });
            if (cached) {
                logger_simple_util_1.default.debug(`🎯 Cache hit: ${req.method} ${req.originalUrl}`);
                // Establecer headers de caché
                if (cached.headers) {
                    Object.entries(cached.headers).forEach(([name, value]) => {
                        res.setHeader(name, value);
                    });
                }
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Key', key);
                return res.status(cached.status).json(cached.data);
            }
            // Interceptamos el método res.json para cachear la respuesta
            const originalJson = res.json;
            const originalStatus = res.status;
            let statusCode = 200;
            let responseData;
            let responseHeaders = {};
            res.status = function (code) {
                statusCode = code;
                return originalStatus.call(this, code);
            };
            res.json = function (data) {
                responseData = data;
                // Capturar headers importantes
                const importantHeaders = ['content-type', 'cache-control', 'etag'];
                importantHeaders.forEach(header => {
                    const value = res.getHeader(header);
                    if (value) {
                        responseHeaders[header] = String(value);
                    }
                });
                // Cachear respuesta solo si fue exitosa
                if (statusCode >= 200 && statusCode < 300) {
                    const cacheResponse = {
                        status: statusCode,
                        data: responseData,
                        headers: responseHeaders,
                        timestamp: Date.now()
                    };
                    cache.set(key, cacheResponse, { ttl, compress }).catch(error => {
                        logger_simple_util_1.default.warn(`⚠️ Failed to cache response for ${key}:`, error);
                    });
                    logger_simple_util_1.default.debug(`💾 Cache set: ${req.method} ${req.originalUrl} (${key})`);
                }
                res.setHeader('X-Cache', 'MISS');
                res.setHeader('X-Cache-Key', key);
                return originalJson.call(this, data);
            };
            next();
        }
        catch (error) {
            logger_simple_util_1.default.error('❌ Cache middleware error:', error);
            next();
        }
    };
}
/**
 * Middleware para invalidación de caché
 */
function cacheInvalidator(patterns) {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            // Invalidar caché después de respuestas exitosas de escritura
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const cache = (0, cache_service_1.getCacheService)();
                cache.invalidatePatterns(patterns).catch(error => {
                    logger_simple_util_1.default.warn(`⚠️ Cache invalidation failed:`, error);
                });
                logger_simple_util_1.default.debug(`🗑️ Cache invalidated: ${patterns.join(', ')}`);
            }
            return originalSend.call(this, data);
        };
        next();
    };
}
/**
 * Generador de clave por defecto
 */
function defaultKeyGenerator(req) {
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query);
    const params = JSON.stringify(req.params);
    // Incluir headers de variación si se especifican
    const varyHeaders = [];
    if (req.headers.authorization) {
        varyHeaders.push('auth:' + req.headers.authorization.substring(0, 10));
    }
    if (req.headers['accept-language']) {
        varyHeaders.push('lang:' + req.headers['accept-language']);
    }
    const varyPart = varyHeaders.length > 0 ? '|' + varyHeaders.join('|') : '';
    return `${req.method}:${url}:${query}:${params}${varyPart}`;
}
/**
 * Condición por defecto para caché
 */
function defaultCondition(req) {
    // Solo cachear requests GET
    if (req.method !== 'GET') {
        return false;
    }
    // No cachear si hay headers específicos
    const noCacheHeaders = [
        'cache-control',
        'authorization',
        'x-no-cache'
    ];
    for (const header of noCacheHeaders) {
        if (req.headers[header]) {
            return false;
        }
    }
    return true;
}
/**
 * Middleware para caché específico de API endpoints
 */
function apiCacheMiddleware(endpointPatterns, options = {}) {
    return (req, res, next) => {
        const currentPath = req.route?.path || req.path;
        const shouldCache = endpointPatterns.some(pattern => {
            // Simple pattern matching
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(currentPath);
        });
        if (shouldCache) {
            return cacheMiddleware(options)(req, res, next);
        }
        next();
    };
}
/**
 * Middleware para caché de datos de usuario
 */
function userCacheMiddleware(options = {}) {
    const userOptions = {
        ...options,
        keyGenerator: (req) => {
            const userId = req.headers['x-user-id'] || req.user?.id || 'anonymous';
            const baseKey = defaultKeyGenerator(req);
            return `user:${userId}:${baseKey}`;
        },
        ttl: 'short'
    };
    return cacheMiddleware(userOptions);
}
/**
 * Middleware para caché de datos administrativos
 */
function adminCacheMiddleware(options = {}) {
    const adminOptions = {
        ...options,
        condition: (req) => {
            const isAdmin = req.headers['x-user-role'] === 'admin' || req.user?.role === 'admin';
            return defaultCondition(req) && isAdmin;
        },
        ttl: 'short'
    };
    return cacheMiddleware(adminOptions);
}
exports.default = {
    cacheMiddleware,
    cacheInvalidator,
    apiCacheMiddleware,
    userCacheMiddleware,
    adminCacheMiddleware
};
//# sourceMappingURL=cache.middleware.js.map