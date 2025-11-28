"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabaseManager = initializeDatabaseManager;
exports.getDatabaseManager = getDatabaseManager;
const kysely_1 = require("kysely");
const pg_1 = require("pg");
const logger_simple_util_1 = __importDefault(require("../web-api/utils/logger-simple.util"));
class DatabaseManager {
    constructor() {
        this.db = null;
        this.pool = null;
    }
    async initialize(connectionConfig) {
        try {
            this.pool = new pg_1.Pool(connectionConfig);
            this.db = new kysely_1.Kysely({
                dialect: new kysely_1.PostgresDialect({
                    pool: this.pool,
                }),
            });
            // Test connection
            await this.db.selectFrom('materia_prima').select('id').executeTakeFirst();
            logger_simple_util_1.default.info('Database initialized successfully with Kysely');
        }
        catch (error) {
            logger_simple_util_1.default.error('Failed to initialize database:', error);
            throw error;
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.db = null;
            logger_simple_util_1.default.info('Database connection closed');
        }
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }
    async healthCheck() {
        try {
            if (!this.db)
                return false;
            await this.db.selectFrom('materia_prima').select('id').executeTakeFirst();
            return true;
        }
        catch (error) {
            logger_simple_util_1.default.error('Database health check failed:', error);
            return false;
        }
    }
    async transaction(callback) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db.transaction().execute(callback);
    }
}
// Singleton instance
let databaseManager = null;
function initializeDatabaseManager(connectionConfig) {
    if (!databaseManager) {
        databaseManager = new DatabaseManager();
    }
    databaseManager.initialize(connectionConfig);
    return databaseManager;
}
function getDatabaseManager() {
    if (!databaseManager) {
        throw new Error('Database manager not initialized. Call initializeDatabaseManager() first.');
    }
    return databaseManager;
}
exports.default = DatabaseManager;
//# sourceMappingURL=database.js.map