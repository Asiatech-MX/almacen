import { PoolClient } from 'pg';
export interface ConnectionPoolStats {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    activeCount: number;
    totalConnections: number;
    averageAcquisitionTime: number;
    lastAcquisitionTime: number;
}
export interface QueryPerformanceMetrics {
    query: string;
    executionTime: number;
    rowCount: number;
    cacheHit: boolean;
    timestamp: Date;
}
/**
 * Enhanced connection pool with monitoring, caching and performance optimization
 */
export declare class EnhancedConnectionPool {
    private pool;
    private cache;
    private metrics;
    private maxMetricsHistory;
    constructor();
    /**
     * Execute query with caching and performance monitoring
     */
    query<T = any>(text: string, params?: any[], cacheOptions?: {
        ttl: number;
        key: string;
    }): Promise<T>;
    /**
     * Execute query with automatic retry and circuit breaker
     */
    queryWithRetry<T = any>(text: string, params?: any[], maxRetries?: number, backoffMs?: number): Promise<T>;
    /**
     * Get connection from pool for transaction
     */
    getConnection(): Promise<PoolClient>;
    /**
     * Execute transaction with retry logic
     */
    transaction<T>(callback: (client: PoolClient) => Promise<T>, maxRetries?: number): Promise<T>;
    /**
     * Get pool statistics
     */
    getStats(): ConnectionPoolStats;
    /**
     * Get query performance metrics
     */
    getPerformanceMetrics(limit?: number): QueryPerformanceMetrics[];
    /**
     * Get slow queries
     */
    getSlowQueries(thresholdMs?: number, limit?: number): QueryPerformanceMetrics[];
    /**
     * Clear performance metrics
     */
    clearMetrics(): void;
    /**
     * Health check for the pool
     */
    healthCheck(): Promise<boolean>;
    /**
     * Graceful shutdown
     */
    close(): Promise<void>;
    /**
     * Record query metrics
     */
    private recordMetrics;
    /**
     * Calculate average acquisition time
     */
    private calculateAverageAcquisitionTime;
    /**
     * Sleep helper for retry delays
     */
    private sleep;
}
export declare function getConnectionPool(): EnhancedConnectionPool;
export default EnhancedConnectionPool;
//# sourceMappingURL=connection-pool.d.ts.map