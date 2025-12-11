export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database: number;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    lazyConnect: boolean;
    keepAlive: number;
    connectTimeout: number;
    commandTimeout: number;
    keyPrefix: string;
    ttl: {
        default: number;
        short: number;
        medium: number;
        long: number;
        stats: number;
    };
    cluster?: {
        enabled: boolean;
        nodes: Array<{
            host: string;
            port: number;
        }>;
    };
}
export declare const redisConfig: RedisConfig;
export default redisConfig;
//# sourceMappingURL=redis.config.d.ts.map