"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'almacen:',
    ttl: {
        default: 3600, // 1 hour
        short: 300, // 5 minutes
        medium: 1800, // 30 minutes
        long: 7200, // 2 hours
        stats: 600 // 10 minutes
    },
    cluster: {
        enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
        nodes: process.env.REDIS_CLUSTER_NODES
            ? process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
                const [host, port] = node.trim().split(':');
                return { host, port: parseInt(port, 10) };
            })
            : []
    }
};
exports.default = exports.redisConfig;
//# sourceMappingURL=redis.config.js.map