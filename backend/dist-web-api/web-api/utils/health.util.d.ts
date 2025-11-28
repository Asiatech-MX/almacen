/**
 * Health check utilities
 */
/**
 * Basic health check
 */
export declare const basicHealthCheck: () => {
    status: "OK";
    timestamp: string;
    uptime: number;
    version: string;
    environment: any;
};
/**
 * Database health check
 */
export declare const databaseHealthCheck: () => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
/**
 * Memory health check
 */
export declare const memoryHealthCheck: () => {
    used: number;
    total: number;
    free: number;
    percentage: number;
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
};
/**
 * System health check
 */
export declare const systemHealthCheck: () => {
    platform: any;
    arch: any;
    nodeVersion: string;
    loadAverage: any;
    cpus: any;
    totalMemory: any;
    freeMemory: any;
    networkInterfaces: any;
};
/**
 * Application health check
 */
export declare const applicationHealthCheck: () => {
    memory: {
        used: number;
        total: number;
        free: number;
        percentage: number;
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    system: {
        platform: any;
        arch: any;
        nodeVersion: string;
        loadAverage: any;
        cpus: any;
        totalMemory: any;
        freeMemory: any;
        networkInterfaces: any;
    };
    pid: number;
    uptime: number;
    version: string;
    environment: any;
};
/**
 * External service health check
 */
export declare const externalServiceHealthCheck: (serviceUrl: string, timeout?: number) => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
/**
 * Comprehensive health check
 */
export declare const comprehensiveHealthCheck: () => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
/**
 * Health check for specific component
 */
export declare const componentHealthCheck: (componentName: string, checkFunction: () => Promise<{
    status: "healthy" | "unhealthy";
    details?: any;
}>) => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
/**
 * Health check with timeout
 */
export declare const healthCheckWithTimeout: (healthCheckFunction: () => Promise<any>, timeoutMs?: number) => Promise<{
    status: "healthy" | "unhealthy";
    details?: any;
}>;
/**
 * Health check with retry
 */
export declare const healthCheckWithRetry: (healthCheckFunction: () => Promise<any>, maxRetries?: number, retryDelay?: number) => Promise<{
    status: "healthy" | "unhealthy";
    details?: any;
}>;
/**
 * Create health response
 */
export declare const createHealthResponse: (status: "OK" | "ERROR", data?: any, message?: string) => {
    status: "OK" | "ERROR";
    data: any;
    message: string;
    timestamp: string;
};
/**
 * Check if service is in maintenance mode
 */
export declare const isMaintenanceMode: () => boolean;
/**
 * Get maintenance message
 */
export declare const getMaintenanceMessage: () => string;
/**
 * Check if feature is enabled
 */
export declare const isFeatureEnabled: (featureName: string) => boolean;
/**
 * Get feature status
 */
export declare const getFeatureStatus: (featureName: string) => {
    enabled: boolean;
    disabled: boolean;
    status: string;
};
/**
 * Get all feature statuses
 */
export declare const getAllFeatureStatuses: () => Record<string, any>;
/**
 * Health check for dependencies
 */
export declare const dependencyHealthCheck: (dependencies: Array<{
    name: string;
    url: string;
    timeout?: number;
}>) => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
/**
 * Health check for cache
 */
export declare const cacheHealthCheck: () => {
    status: string;
    details: {
        type: string;
        message: string;
    };
};
/**
 * Health check for file system
 */
export declare const fileSystemHealthCheck: () => {
    status: string;
    details: {
        writable: number;
        readable: number;
        freeSpace: any;
        totalSpace: any;
        error?: undefined;
    };
} | {
    status: string;
    details: {
        error: any;
        writable?: undefined;
        readable?: undefined;
        freeSpace?: undefined;
        totalSpace?: undefined;
    };
};
/**
 * Health check for network connectivity
 */
export declare const networkHealthCheck: (host?: string, port?: number, timeout?: number) => Promise<{
    status: "healthy" | "unhealthy";
    details: any;
}>;
declare const _default: {
    basicHealthCheck: () => {
        status: "OK";
        timestamp: string;
        uptime: number;
        version: string;
        environment: any;
    };
    databaseHealthCheck: () => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
    memoryHealthCheck: () => {
        used: number;
        total: number;
        free: number;
        percentage: number;
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    systemHealthCheck: () => {
        platform: any;
        arch: any;
        nodeVersion: string;
        loadAverage: any;
        cpus: any;
        totalMemory: any;
        freeMemory: any;
        networkInterfaces: any;
    };
    applicationHealthCheck: () => {
        memory: {
            used: number;
            total: number;
            free: number;
            percentage: number;
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        };
        system: {
            platform: any;
            arch: any;
            nodeVersion: string;
            loadAverage: any;
            cpus: any;
            totalMemory: any;
            freeMemory: any;
            networkInterfaces: any;
        };
        pid: number;
        uptime: number;
        version: string;
        environment: any;
    };
    comprehensiveHealthCheck: () => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
    componentHealthCheck: (componentName: string, checkFunction: () => Promise<{
        status: "healthy" | "unhealthy";
        details?: any;
    }>) => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
    healthCheckWithTimeout: (healthCheckFunction: () => Promise<any>, timeoutMs?: number) => Promise<{
        status: "healthy" | "unhealthy";
        details?: any;
    }>;
    healthCheckWithRetry: (healthCheckFunction: () => Promise<any>, maxRetries?: number, retryDelay?: number) => Promise<{
        status: "healthy" | "unhealthy";
        details?: any;
    }>;
    createHealthResponse: (status: "OK" | "ERROR", data?: any, message?: string) => {
        status: "OK" | "ERROR";
        data: any;
        message: string;
        timestamp: string;
    };
    isMaintenanceMode: () => boolean;
    getMaintenanceMessage: () => string;
    isFeatureEnabled: (featureName: string) => boolean;
    getFeatureStatus: (featureName: string) => {
        enabled: boolean;
        disabled: boolean;
        status: string;
    };
    getAllFeatureStatuses: () => Record<string, any>;
    dependencyHealthCheck: (dependencies: Array<{
        name: string;
        url: string;
        timeout?: number;
    }>) => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
    cacheHealthCheck: () => {
        status: string;
        details: {
            type: string;
            message: string;
        };
    };
    fileSystemHealthCheck: () => {
        status: string;
        details: {
            writable: number;
            readable: number;
            freeSpace: any;
            totalSpace: any;
            error?: undefined;
        };
    } | {
        status: string;
        details: {
            error: any;
            writable?: undefined;
            readable?: undefined;
            freeSpace?: undefined;
            totalSpace?: undefined;
        };
    };
    networkHealthCheck: (host?: string, port?: number, timeout?: number) => Promise<{
        status: "healthy" | "unhealthy";
        details: any;
    }>;
};
export default _default;
//# sourceMappingURL=health.util.d.ts.map