/**
 * Mock Cache Service para desarrollo y testing
 * Implementa una simulación de las operaciones de caché Redis
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
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

interface CacheItem<T> {
  value: T;
  expiresAt?: number;
  createdAt: number;
}

export class MockCacheService implements MockCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalOperations: 0
  };

  async get<T>(key: string): Promise<T | null> {
    this.stats.totalOperations++;

    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    this.stats.totalOperations++;

    const item: CacheItem<T> = {
      value,
      createdAt: Date.now()
    };

    if (options?.ttl) {
      item.expiresAt = Date.now() + (options.ttl * 1000);
    }

    this.cache.set(key, item);
  }

  async del(key: string): Promise<void> {
    this.stats.totalOperations++;
    this.cache.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    this.stats.totalOperations++;

    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    );

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    this.stats.totalOperations++;

    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async keys(pattern?: string): Promise<string[]> {
    this.stats.totalOperations++;

    let keys = Array.from(this.cache.keys());

    // Filter expired keys
    const now = Date.now();
    keys = keys.filter(key => {
      const item = this.cache.get(key);
      return !item?.expiresAt || now <= item.expiresAt;
    });

    if (pattern && pattern !== '*') {
      const regex = new RegExp(
        pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
      );
      keys = keys.filter(key => regex.test(key));
    }

    return keys;
  }

  async flushAll(): Promise<void> {
    this.stats.totalOperations++;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try a basic operation
      const testKey = '__health_check__';
      await this.set(testKey, 'ok');
      const value = await this.get(testKey);
      await this.del(testKey);

      return value === 'ok';
    } catch {
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    // Remove expired items before counting
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.cache.delete(key);
      }
    }

    const hitRate = this.stats.totalOperations > 0
      ? (this.stats.hits / this.stats.totalOperations) * 100
      : 0;

    // Estimate memory usage (rough calculation)
    let memoryEstimate = 0;
    for (const [key, item] of this.cache.entries()) {
      memoryEstimate += key.length * 2; // UTF-16 chars
      memoryEstimate += JSON.stringify(item.value).length * 2;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      totalKeys: this.cache.size,
      memoryUsage: memoryEstimate < 1024
        ? `${memoryEstimate}B`
        : memoryEstimate < 1024 * 1024
          ? `${Math.round(memoryEstimate / 1024)}KB`
          : `${Math.round(memoryEstimate / (1024 * 1024))}MB`
    };
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    this.stats.totalOperations++;

    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);

    return newValue;
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    this.stats.totalOperations++;

    const current = await this.get<number>(key) || 0;
    const newValue = Math.max(0, current - amount); // Don't go below 0
    await this.set(key, newValue);

    return newValue;
  }

  // Additional utility methods for specific use cases
  async setWithPattern(pattern: string, value: any, options?: CacheOptions): Promise<void> {
    this.stats.totalOperations++;

    // This would set multiple keys matching a pattern (mock implementation)
    // In real Redis, this would be more complex
    const keys = await this.keys(pattern);
    for (const key of keys) {
      await this.set(key, value, options);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    this.stats.totalOperations++;

    const results: (T | null)[] = [];
    for (const key of keys) {
      const value = await this.get<T>(key);
      results.push(value);
    }

    return results;
  }

  async mset<T>(items: { key: string; value: T; options?: CacheOptions }[]): Promise<void> {
    this.stats.totalOperations++;

    for (const item of items) {
      await this.set(item.key, item.value, item.options);
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    this.stats.totalOperations++;

    const item = this.cache.get(key);
    if (item) {
      item.expiresAt = Date.now() + (ttl * 1000);
      this.cache.set(key, item);
    }
  }

  async ttl(key: string): Promise<number> {
    this.stats.totalOperations++;

    const item = this.cache.get(key);
    if (!item || !item.expiresAt) {
      return -1;
    }

    const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2; // -2 means key exists but has no expiry
  }
}

// Singleton instance for mock usage
let mockCacheServiceInstance: MockCacheService | null = null;

export const getCacheService = (): MockCacheService => {
  if (!mockCacheServiceInstance) {
    mockCacheServiceInstance = new MockCacheService();
  }
  return mockCacheServiceInstance;
};

// Factory function for creating new instances
export const createMockCacheService = (): MockCacheService => {
  return new MockCacheService();
};

// Types for middleware compatibility
export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: any) => string;
  condition?: (req: any) => boolean;
  skipCache?: (req: any) => boolean;
}

// Mock cache middleware functions
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  return async (req: any, res: any, next: any) => {
    // Basic mock implementation
    const cacheService = getCacheService();
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : `cache:${req.method}:${req.originalUrl || req.url}`;

    // Skip cache if condition is not met
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    try {
      const cached = await cacheService.get(key);
      if (cached) {
        return res.json(cached);
      }
    } catch (error) {
      // Cache errors shouldn't block the request
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(key, data, { ttl: options.ttl }).catch(() => {
          // Ignore cache errors
        });
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

export const cacheInvalidator = (pattern: string) => {
  return async (req: any, res: any, next: any) => {
    const cacheService = getCacheService();

    // Invalidate cache after request completes
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      cacheService.delPattern(pattern).catch(() => {
        // Ignore cache errors
      });
      return originalEnd.apply(this, args);
    };

    next();
  };
};

export const apiCacheMiddleware = cacheMiddleware({ ttl: 300 }); // 5 minutes default
export const userCacheMiddleware = cacheMiddleware({ ttl: 600 }); // 10 minutes default
export const adminCacheMiddleware = cacheMiddleware({ ttl: 1800 }); // 30 minutes default

// Mock Redis configuration
export const redisConfig = {
  host: 'localhost',
  port: 6379,
  password: undefined,
  db: 0,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keyPrefix: 'almacen:',
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
  cluster: undefined
};