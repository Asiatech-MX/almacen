"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
// Import database
const database_1 = require("../database/database");
const web_api_cjs_1 = require("./config/web-api.cjs");
// Import middleware
const cors_1 = require("./middleware/cors");
const rateLimiter_1 = require("./middleware/rateLimiter");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const health_routes_1 = require("./routes/health.routes");
const materiaPrima_routes_1 = require("./routes/materiaPrima.routes");
const proveedores_routes_1 = require("./routes/proveedores.routes");
const stock_routes_1 = require("./routes/stock.routes");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
// CORS middleware
app.use(cors_1.corsMiddleware);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression middleware
app.use((0, compression_1.default)());
// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined'));
}
app.use(requestLogger_1.requestLogger);
// Rate limiting
app.use(rateLimiter_1.rateLimiter);
// Health check routes (no rate limiting)
app.use('/api/health', health_routes_1.healthRoutes);
// API routes
app.use('/api/materiaPrima', materiaPrima_routes_1.materiaPrimaRoutes);
app.use('/api/proveedores', proveedores_routes_1.proveedoresRoutes);
app.use('/api/stock', stock_routes_1.stockRoutes);
// API documentation (if enabled)
if (process.env.ENABLE_API_DOCS === 'true') {
    app.get('/api/docs', (req, res) => {
        res.json({
            message: 'API Documentation',
            version: process.env.API_VERSION || 'v1',
            endpoints: {
                health: '/api/health',
                materiaPrima: '/api/materiaPrima',
                proveedores: '/api/proveedores',
                stock: '/api/stock'
            }
        });
    });
}
// Metrics endpoint (if enabled)
if (process.env.ENABLE_METRICS === 'true') {
    app.get(process.env.METRICS_PATH || '/metrics', (req, res) => {
        res.json({
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version,
            node: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString()
        });
    });
}
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Not Found',
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Initialize database
const initializeApp = async () => {
    try {
        // Initialize database connection
        await (0, database_1.initializeDatabaseManager)(web_api_cjs_1.config.database);
        console.log('✅ Database initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
    // Start server
    const PORT = process.env.PORT || 3013;
    const HOST = process.env.HOST || '0.0.0.0';
    server.listen(PORT, HOST, () => {
        console.log(`🚀 Server running on http://${HOST}:${PORT}`);
        console.log(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
        console.log(`🏥 Health Check: http://${HOST}:${PORT}/api/health`);
        console.log(`📊 Metrics: http://${HOST}:${PORT}${process.env.METRICS_PATH || '/metrics'}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};
// Start the application
initializeApp();
exports.default = app;
//# sourceMappingURL=index.js.map