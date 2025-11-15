const http = require('http');

// Lista de rutas a probar
const routes = [
    '/',
    '#/',
    '#/materia-prima/gestion',
    '#/materia-prima/nueva',
    '#/materia-prima/consultas',
    '#/materia-prima/editar/1'
];

// Función para probar una ruta
async function testRoute(route) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5175,
            path: '/',
            method: 'GET',
            headers: {
                'User-Agent': 'Route-Tester/1.0'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    route,
                    status: res.statusCode,
                    headers: res.headers,
                    hasContent: data.length > 0,
                    contentLength: data.length
                });
            });
        });

        req.on('error', (error) => {
            reject({
                route,
                error: error.message
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject({
                route,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

// Función principal para probar todas las rutas
async function main() {
    console.log('🧪 Probando rutas de Materia Prima en http://localhost:5175\n');
    console.log('⚠️  Nota: Como es una aplicación HashRouter, las rutas con # se manejan del lado del cliente\n');

    try {
        // Primero probamos si el servidor responde
        console.log('📡 Verificando conexión con el servidor...');
        const baseResponse = await testRoute('/');

        if (baseResponse.error) {
            console.log('❌ Error de conexión:', baseResponse.error);
            console.log('\n💡 Soluciones posibles:');
            console.log('1. Asegúrate que el servidor está corriendo: pnpm dev');
            console.log('2. Verifica que el puerto 5175 esté disponible');
            console.log('3. Revisa la configuración de red/local');
            return;
        }

        console.log('✅ Servidor responde correctamente');
        console.log(`📊 Status: ${baseResponse.status}`);
        console.log(`📏 Content-Length: ${baseResponse.contentLength}`);
        console.log(`🔍 Headers:`, Object.keys(baseResponse.headers));

        console.log('\n📋 Análisis de la aplicación:');
        console.log('🏗️  La aplicación usa HashRouter (react-router-dom)');
        console.log('🔗 Las rutas con # se manejan del lado del cliente');
        console.log('🖥️  Debes abrir la aplicación en un navegador web\n');

        console.log('📍 RUTAS CORRECTAS PARA ACCEDER EN NAVEGADOR:');
        console.log('═══════════════════════════════════════════════');
        console.log('1️⃣  Principal:     http://localhost:5175/#/');
        console.log('2️⃣  Gestión:       http://localhost:5175/#/materia-prima/gestion');
        console.log('3️⃣  Nuevo:         http://localhost:5175/#/materia-prima/nueva');
        console.log('4️⃣  Consultas:     http://localhost:5175/#/materia-prima/consultas');
        console.log('5️⃣  Editar:        http://localhost:5175/#/materia-prima/editar/1\n');

        console.log('🎯 Mock Data esperado en la tabla de gestión:');
        console.log('• Cemento Gris - 150 unidades (stock: 150/50)');
        console.log('• Ladrillo Rojo - 500 unidades (stock: 500/200)');
        console.log('• Pintura Blanca - 25 unidades (stock: 25/10)\n');

        console.log('🚀 Pasos para probar manualmente:');
        console.log('1. Abre tu navegador web');
        console.log('2. Ve a: http://localhost:5175/#/materia-prima/gestion');
        console.log('3. Deberías ver la tabla con los 3 materiales');
        console.log('4. Usa el menú lateral para navegar a otras secciones\n');

        console.log('🐛 Si ves páginas en blanco:');
        console.log('• Abre las herramientas de desarrollador (F12)');
        console.log('• Revisa la pestaña Console para errores');
        console.log('• Verifica que la URL incluya el hashtag #');
        console.log('• Recarga la página con Ctrl+F5\n');

    } catch (error) {
        console.log('❌ Error durante la prueba:', error);
    }
}

main();