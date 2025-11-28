import { Request, Response, NextFunction } from 'express';
import { CacheTTL } from './cache.service';
export interface CacheMiddlewareOptions {
    keyGenerator?: (req: Request) => string;
    ttl?: CacheTTL | number;
    condition?: (req: Request) => boolean;
    compress?: boolean;
    vary?: string[];
    skipMethods?: string[];
}
/**
 * Middleware para caché de respuestas HTTP
 * Almacena respuestas GET en Redis con configuración flexible
 */
export declare function cacheMiddleware(options?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware para invalidación de caché
 */
export declare function cacheInvalidator(patterns: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware para caché específico de API endpoints
 */
export declare function apiCacheMiddleware(endpointPatterns: string[], options?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware para caché de datos de usuario
 */
export declare function userCacheMiddleware(options?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware para caché de datos administrativos
 */
export declare function adminCacheMiddleware(options?: CacheMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    cacheMiddleware: typeof cacheMiddleware;
    cacheInvalidator: typeof cacheInvalidator;
    apiCacheMiddleware: typeof apiCacheMiddleware;
    userCacheMiddleware: typeof userCacheMiddleware;
    adminCacheMiddleware: typeof adminCacheMiddleware;
};
export default _default;
//# sourceMappingURL=cache.middleware.d.ts.map