import { Request, Response, NextFunction } from 'express';
export interface RequestMetrics {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ip?: string;
    timestamp: Date;
    error?: string;
}
export interface PerformanceMetrics {
    endpoint: string;
    method: string;
    count: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    totalResponseTime: number;
    errorCount: number;
    errorRate: number;
    lastAccessed: Date;
}
export interface AlertRule {
    name: string;
    condition: (metrics: any) => boolean;
    threshold: number;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
}
/**
 * Metrics collection and analysis service
 */
export declare class MetricsService {
    private requestMetrics;
    private performanceMetrics;
    private alertRules;
    private maxMetricsHistory;
    private metricsCollectionInterval;
    constructor();
    /**
     * Middleware to collect request metrics
     */
    requestMetricsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Record request metrics
     */
    private recordRequestMetrics;
    /**
     * Update performance metrics for an endpoint
     */
    private updatePerformanceMetrics;
    /**
     * Get request metrics with filtering
     */
    getRequestMetrics(options?: {
        limit?: number;
        method?: string;
        url?: string;
        statusCode?: number;
        errorsOnly?: boolean;
        timeRange?: {
            start: Date;
            end: Date;
        };
    }): RequestMetrics[];
    /**
     * Get performance metrics summary
     */
    getPerformanceMetricsSummary(): {
        totalEndpoints: number;
        slowestEndpoints: PerformanceMetrics[];
        highestErrorRate: PerformanceMetrics[];
        mostFrequent: PerformanceMetrics[];
    };
    /**
     * Get endpoint-specific metrics
     */
    getEndpointMetrics(endpoint: string, method?: string): PerformanceMetrics | null;
    /**
     * Setup default alert rules
     */
    private setupDefaultAlerts;
    /**
     * Check alert rules and trigger alerts
     */
    private checkAlerts;
    /**
     * Trigger an alert
     */
    private triggerAlert;
    /**
     * Add custom alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Get all alert rules
     */
    getAlertRules(): AlertRule[];
    /**
     * Enable/disable alert rule
     */
    toggleAlertRule(name: string, enabled: boolean): boolean;
    /**
     * Get metrics statistics
     */
    getMetricsStats(): {
        totalRequests: number;
        errorRate: number;
        averageResponseTime: number;
        requestsPerMinute: number;
        topEndpoints: Array<{
            endpoint: string;
            method: string;
            count: number;
        }>;
    };
    /**
     * Clear all metrics
     */
    clearMetrics(): void;
    /**
     * Start metrics collection interval
     */
    private startMetricsCollection;
    /**
     * Stop metrics collection
     */
    stopMetricsCollection(): void;
    /**
     * Export metrics for external monitoring systems
     */
    exportMetrics(): string;
}
export declare function getMetricsService(): MetricsService;
export default MetricsService;
//# sourceMappingURL=metrics.service.d.ts.map