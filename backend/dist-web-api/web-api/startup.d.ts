/**
 * Application startup configuration and initialization
 */
export declare class StartupService {
    private static instance;
    private isInitialized;
    private constructor();
    static getInstance(): StartupService;
    /**
     * Initialize all application services
     */
    initialize(): Promise<void>;
    /**
     * Initialize database connection pool
     */
    private initializeDatabase;
    /**
     * Initialize cache service
     */
    private initializeCache;
    /**
     * Initialize monitoring services
     */
    private initializeMonitoring;
    /**
     * Setup graceful shutdown handlers
     */
    private setupGracefulShutdown;
    /**
     * Run application self-tests
     */
    private runSelfTests;
    /**
     * Test database connectivity
     */
    private testDatabaseConnectivity;
    /**
     * Test cache functionality
     */
    private testCacheFunctionality;
    /**
     * Test basic API endpoints
     */
    private testBasicEndpoints;
    /**
     * Get initialization status
     */
    isReady(): boolean;
    /**
     * Get application status information
     */
    getStatus(): Promise<{
        initialized: boolean;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        timestamp: Date;
    }>;
}
export declare const startupService: StartupService;
export declare const initializeApplication: () => Promise<void>;
export default startupService;
//# sourceMappingURL=startup.d.ts.map