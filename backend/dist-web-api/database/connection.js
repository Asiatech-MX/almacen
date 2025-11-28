"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
const pg_1 = require("pg");
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
class DatabaseConnection {
    constructor(config) {
        this.pool = null;
        this.config = {
            ...config,
            max: config.max || 20,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
        };
    }
    async connect() {
        try {
            this.pool = new pg_1.Pool(this.config);
            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            logger_simple_util_1.default.info('Database connection established successfully');
        }
        catch (error) {
            logger_simple_util_1.default.error('Failed to connect to database:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger_simple_util_1.default.info('Database connection closed');
        }
    }
    getPool() {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.pool;
    }
    async healthCheck() {
        try {
            if (!this.pool)
                return false;
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        }
        catch (error) {
            logger_simple_util_1.default.error('Database health check failed:', error);
            return false;
        }
    }
    async transaction(callback) {
        const client = await this.getPool().connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
// Singleton instance
let databaseConnection = null;
function initializeDatabase(config) {
    if (!databaseConnection) {
        databaseConnection = new DatabaseConnection(config);
    }
    return databaseConnection;
}
function getDatabase() {
    if (!databaseConnection) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return databaseConnection;
}
exports.default = DatabaseConnection;
//# sourceMappingURL=connection.js.map