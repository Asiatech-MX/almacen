"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
exports.getMetricsService = getMetricsService;
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
/**
 * Metrics collection and analysis service
 */
class MetricsService {
    constructor() {
        this.requestMetrics = [];
        this.performanceMetrics = new Map();
        this.alertRules = [];
        this.maxMetricsHistory = 10000;
        this.metricsCollectionInterval = null;
        this.setupDefaultAlerts();
        this.startMetricsCollection();
    }
    /**
     * Middleware to collect request metrics
     */
    requestMetricsMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            // Track response
            const originalSend = res.send;
            let statusCode = 200;
            let error;
            res.status = function (code) {
                statusCode = code;
                return this;
            };
            res.send = function (data) {
                // Check if response contains an error
                if (typeof data === 'object' && data?.error) {
                    error = data.error;
                }
                const responseTime = Date.now() - startTime;
                // Record metrics
                this.recordRequestMetrics({
                    method: req.method,
                    url: req.originalUrl || req.url,
                    statusCode,
                    responseTime,
                    userAgent: req.headers['user-agent'],
                    ip: req.ip || req.connection.remoteAddress,
                    timestamp: new Date(),
                    error
                });
                // Update performance metrics
                this.updatePerformanceMetrics(req.method, req.originalUrl || req.url, responseTime, statusCode >= 400);
                // Log slow requests
                if (responseTime > 1000) {
                    logger_simple_util_1.default.warn(`🐌 Slow request detected: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
                }
                // Check alerts
                this.checkAlerts();
                return originalSend.call(this, data);
            }.bind(this);
            next();
        };
    }
    /**
     * Record request metrics
     */
    recordRequestMetrics(metrics) {
        this.requestMetrics.push(metrics);
        // Limit history size
        if (this.requestMetrics.length > this.maxMetricsHistory) {
            this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsHistory);
        }
    }
    /**
     * Update performance metrics for an endpoint
     */
    updatePerformanceMetrics(method, url, responseTime, isError) {
        const key = `${method}:${url}`;
        const existing = this.performanceMetrics.get(key);
        if (existing) {
            existing.count++;
            existing.totalResponseTime += responseTime;
            existing.averageResponseTime = existing.totalResponseTime / existing.count;
            existing.minResponseTime = Math.min(existing.minResponseTime, responseTime);
            existing.maxResponseTime = Math.max(existing.maxResponseTime, responseTime);
            existing.lastAccessed = new Date();
            if (isError) {
                existing.errorCount++;
            }
            existing.errorRate = (existing.errorCount / existing.count) * 100;
        }
        else {
            this.performanceMetrics.set(key, {
                endpoint: url,
                method,
                count: 1,
                averageResponseTime: responseTime,
                minResponseTime: responseTime,
                maxResponseTime: responseTime,
                totalResponseTime: responseTime,
                errorCount: isError ? 1 : 0,
                errorRate: isError ? 100 : 0,
                lastAccessed: new Date()
            });
        }
    }
    /**
     * Get request metrics with filtering
     */
    getRequestMetrics(options = {}) {
        let filtered = [...this.requestMetrics];
        if (options.method) {
            filtered = filtered.filter(m => m.method === options.method);
        }
        if (options.url) {
            filtered = filtered.filter(m => m.url.includes(options.url));
        }
        if (options.statusCode) {
            filtered = filtered.filter(m => m.statusCode === options.statusCode);
        }
        if (options.errorsOnly) {
            filtered = filtered.filter(m => m.statusCode >= 400);
        }
        if (options.timeRange) {
            filtered = filtered.filter(m => m.timestamp >= options.timeRange.start &&
                m.timestamp <= options.timeRange.end);
        }
        // Sort by timestamp (most recent first) and limit
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return options.limit ? filtered.slice(0, options.limit) : filtered;
    }
    /**
     * Get performance metrics summary
     */
    getPerformanceMetricsSummary() {
        const metrics = Array.from(this.performanceMetrics.values());
        return {
            totalEndpoints: metrics.length,
            slowestEndpoints: metrics
                .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
                .slice(0, 10),
            highestErrorRate: metrics
                .filter(m => m.errorCount > 0)
                .sort((a, b) => b.errorRate - a.errorRate)
                .slice(0, 10),
            mostFrequent: metrics
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
        };
    }
    /**
     * Get endpoint-specific metrics
     */
    getEndpointMetrics(endpoint, method) {
        for (const [key, metrics] of this.performanceMetrics.entries()) {
            const [keyMethod, keyEndpoint] = key.split(':');
            if (keyEndpoint === endpoint && (!method || keyMethod === method)) {
                return metrics;
            }
        }
        return null;
    }
    /**
     * Setup default alert rules
     */
    setupDefaultAlerts() {
        this.alertRules = [
            {
                name: 'High Response Time',
                condition: (metrics) => metrics.averageResponseTime > 2000,
                threshold: 2000,
                message: 'Average response time is too high',
                severity: 'warning',
                enabled: true
            },
            {
                name: 'High Error Rate',
                condition: (metrics) => metrics.errorRate > 10,
                threshold: 10,
                message: 'Error rate is too high',
                severity: 'critical',
                enabled: true
            },
            {
                name: 'Slow Endpoint Alert',
                condition: (metrics) => metrics.maxResponseTime > 5000,
                threshold: 5000,
                message: 'Maximum response time exceeded threshold',
                severity: 'warning',
                enabled: true
            },
            {
                name: 'Frequent Errors Alert',
                condition: (metrics) => metrics.errorCount > 50,
                threshold: 50,
                message: 'High number of errors detected',
                severity: 'error',
                enabled: true
            }
        ];
    }
    /**
     * Check alert rules and trigger alerts
     */
    checkAlerts() {
        for (const [key, metrics] of this.performanceMetrics.entries()) {
            for (const rule of this.alertRules.filter(r => r.enabled)) {
                if (rule.condition(metrics)) {
                    this.triggerAlert(rule, metrics);
                }
            }
        }
    }
    /**
     * Trigger an alert
     */
    triggerAlert(rule, metrics) {
        const alertMessage = `[${rule.severity.toUpperCase()}] ${rule.message}: ${metrics.method} ${metrics.endpoint} (${metrics.averageResponseTime}ms avg, ${metrics.errorRate}% error rate)`;
        switch (rule.severity) {
            case 'critical':
                logger_simple_util_1.default.error(`🚨 ${alertMessage}`);
                break;
            case 'error':
                logger_simple_util_1.default.error(`❌ ${alertMessage}`);
                break;
            case 'warning':
                logger_simple_util_1.default.warn(`⚠️ ${alertMessage}`);
                break;
            case 'info':
                logger_simple_util_1.default.info(`ℹ️ ${alertMessage}`);
                break;
        }
    }
    /**
     * Add custom alert rule
     */
    addAlertRule(rule) {
        this.alertRules.push(rule);
    }
    /**
     * Get all alert rules
     */
    getAlertRules() {
        return [...this.alertRules];
    }
    /**
     * Enable/disable alert rule
     */
    toggleAlertRule(name, enabled) {
        const rule = this.alertRules.find(r => r.name === name);
        if (rule) {
            rule.enabled = enabled;
            return true;
        }
        return false;
    }
    /**
     * Get metrics statistics
     */
    getMetricsStats() {
        const totalRequests = this.requestMetrics.length;
        const errors = this.requestMetrics.filter(m => m.statusCode >= 400);
        const errorRate = totalRequests > 0 ? (errors.length / totalRequests) * 100 : 0;
        const averageResponseTime = totalRequests > 0
            ? this.requestMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
            : 0;
        // Calculate requests per minute (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentRequests = this.requestMetrics.filter(m => m.timestamp >= oneHourAgo);
        const requestsPerMinute = recentRequests.length / 60;
        // Top endpoints by frequency
        const endpointCounts = new Map();
        for (const metrics of this.performanceMetrics.values()) {
            endpointCounts.set(`${metrics.method}:${metrics.endpoint}`, {
                endpoint: metrics.endpoint,
                method: metrics.method,
                count: metrics.count
            });
        }
        const topEndpoints = Array.from(endpointCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalRequests,
            errorRate,
            averageResponseTime,
            requestsPerMinute,
            topEndpoints
        };
    }
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.requestMetrics = [];
        this.performanceMetrics.clear();
        logger_simple_util_1.default.info('🧹 All metrics cleared');
    }
    /**
     * Start metrics collection interval
     */
    startMetricsCollection() {
        // Clean up old metrics every 5 minutes
        this.metricsCollectionInterval = setInterval(() => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            // Clean old request metrics
            this.requestMetrics = this.requestMetrics.filter(m => m.timestamp >= oneHourAgo);
            // Clean old performance metrics (last accessed more than 24 hours ago)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            for (const [key, metrics] of this.performanceMetrics.entries()) {
                if (metrics.lastAccessed < oneDayAgo) {
                    this.performanceMetrics.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }
    /**
     * Stop metrics collection
     */
    stopMetricsCollection() {
        if (this.metricsCollectionInterval) {
            clearInterval(this.metricsCollectionInterval);
            this.metricsCollectionInterval = null;
        }
    }
    /**
     * Export metrics for external monitoring systems
     */
    exportMetrics() {
        const stats = this.getMetricsStats();
        const performance = this.getPerformanceMetricsSummary();
        return JSON.stringify({
            timestamp: new Date(),
            stats,
            performance,
            alertRules: this.alertRules.map(r => ({
                name: r.name,
                enabled: r.enabled,
                severity: r.severity
            }))
        }, null, 2);
    }
}
exports.MetricsService = MetricsService;
// Singleton instance
let metricsService = null;
function getMetricsService() {
    if (!metricsService) {
        metricsService = new MetricsService();
    }
    return metricsService;
}
exports.default = MetricsService;
//# sourceMappingURL=metrics.service.js.map