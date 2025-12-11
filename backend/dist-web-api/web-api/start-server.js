"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const database_util_1 = require("./utils/database.util");
/**
 * Script para iniciar el servidor Web API
 * Verifica conexión a base de datos antes de iniciar
 */
async function main() {
    console.log('🔧 Iniciando Web API Server...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    // Verificar conexión a base de datos
    console.log('🗄️ Verificando conexión a base de datos...');
    const dbConnected = await (0, database_util_1.testConnection)();
    if (!dbConnected) {
        console.error('❌ No se pudo establecer conexión a la base de datos');
        console.error('🔧 Verifique las variables de entorno:');
        console.error('   - DATABASE_URL');
        console.error('   - PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD');
        process.exit(1);
    }
    console.log('✅ Conexión a base de datos establecida');
    // Iniciar servidor
    const port = parseInt(process.env.WEB_API_PORT || '3001');
    try {
        await (0, server_1.startServer)(port);
        console.log(`🚀 Web API Server iniciado exitosamente en puerto ${port}`);
        console.log(`📍 Health check: http://localhost:${port}/health`);
        console.log(`🔧 API Base URL: http://localhost:${port}/api`);
        console.log(`🌐 CORS habilitado para Chrome DevTools`);
    }
    catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
}
// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Iniciar aplicación
main().catch((error) => {
    console.error('❌ Error en inicio de aplicación:', error);
    process.exit(1);
});
//# sourceMappingURL=start-server.js.map