"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = exports.adminCacheMiddleware = exports.userCacheMiddleware = exports.apiCacheMiddleware = exports.cacheInvalidator = exports.cacheMiddleware = exports.getCacheService = exports.CacheService = void 0;
// Cache service and middleware
var cache_service_1 = require("./cache.service");
Object.defineProperty(exports, "CacheService", { enumerable: true, get: function () { return cache_service_1.CacheService; } });
Object.defineProperty(exports, "getCacheService", { enumerable: true, get: function () { return cache_service_1.getCacheService; } });
var cache_middleware_1 = require("./cache.middleware");
Object.defineProperty(exports, "cacheMiddleware", { enumerable: true, get: function () { return cache_middleware_1.cacheMiddleware; } });
Object.defineProperty(exports, "cacheInvalidator", { enumerable: true, get: function () { return cache_middleware_1.cacheInvalidator; } });
Object.defineProperty(exports, "apiCacheMiddleware", { enumerable: true, get: function () { return cache_middleware_1.apiCacheMiddleware; } });
Object.defineProperty(exports, "userCacheMiddleware", { enumerable: true, get: function () { return cache_middleware_1.userCacheMiddleware; } });
Object.defineProperty(exports, "adminCacheMiddleware", { enumerable: true, get: function () { return cache_middleware_1.adminCacheMiddleware; } });
// Config
var redis_config_1 = require("./redis.config");
Object.defineProperty(exports, "redisConfig", { enumerable: true, get: function () { return redis_config_1.redisConfig; } });
// Re-exportamos para facilidad de uso
exports.default = {
    CacheService,
    getCacheService,
    cacheMiddleware,
    cacheInvalidator,
    apiCacheMiddleware,
    userCacheMiddleware,
    adminCacheMiddleware,
    redisConfig
};
//# sourceMappingURL=index.js.map