export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    components: ComponentHealth[];
    uptime: number;
    version: string;
}
export interface ComponentHealth {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    details?: Record<string, any>;
    error?: string;
}
export interface SystemMetrics {
    memory: MemoryMetrics;
    cpu: CPUMetrics;
    requests: RequestMetrics;
    performance: PerformanceMetrics;
}
export interface MemoryMetrics {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
}
export interface CPUMetrics {
    usage: number;
    loadAverage: number[];
}
export interface RequestMetrics {
    total: number;
    errors: number;
    rate: number;
    averageResponseTime: number;
}
export interface PerformanceMetrics {
    cacheHitRate: number;
    dbConnections: number;
    slowQueries: number;
    averageQueryTime: number;
}
/**
 * Health monitoring service with comprehensive system checks
 */
export declare class HealthService {
    private startTime;
    private requestMetrics;
    /**
     * Get overall system health status
     */
    getHealthStatus(): Promise<HealthStatus>;
    /**
     * Get system metrics
     */
    getSystemMetrics(): Promise<SystemMetrics>;
    /**
     * Record request metrics
     */
    recordRequest(responseTime: number, isError?: boolean): void;
    /**
     * Check database health
     */
    private checkDatabaseHealth;
    /**
     * Check cache health
     */
    private checkCacheHealth;
    /**
     * Check memory health
     */
    private checkMemoryHealth;
    /**
     * Get memory metrics
     */
    private getMemoryMetrics;
    /**
     * Get CPU metrics
     */
    private getCPUMetrics;
    /**
     * Get request metrics
     */
    private getRequestMetrics;
    /**
     * Get performance metrics
     */
    private getPerformanceMetrics;
    /**
     * Determine overall health status
     */
    private determineOverallStatus;
    /**
     * Health check endpoint middleware
     */
    healthCheck(): (req: any, res: any) => Promise<void>;
    /**
     * Readiness check endpoint (for Kubernetes)
     */
    readinessCheck(): (req: any, res: any) => Promise<void>;
    /**
     * Liveness check endpoint (for Kubernetes)
     */
    livenessCheck(): (req: any, res: any) => void;
}
export declare function getHealthService(): HealthService;
export default HealthService;
//# sourceMappingURL=health.service.d.ts.map