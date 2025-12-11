import { Pool, PoolConfig } from 'pg';
export interface DatabaseConfig extends PoolConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
declare class DatabaseConnection {
    private pool;
    private config;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getPool(): Pool;
    healthCheck(): Promise<boolean>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}
export declare function initializeDatabase(config: DatabaseConfig): DatabaseConnection;
export declare function getDatabase(): DatabaseConnection;
export default DatabaseConnection;
//# sourceMappingURL=connection.d.ts.map