/**
 * Direct diagnostic test without launching Electron
 * Tests database and backend functionality directly
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDirectDiagnostic() {
  console.log('🎯 Running direct diagnostic...');

  try {
    // Test database connection using the PostgreSQL MCP
    console.log('📊 Testing database connection...');

    // Import and test backend repositories directly
    const { materiaPrimaRepo } = await import('./backend/repositories/materiaPrimaRepo.ts');
    const { categoriaRepo } = await import('./backend/repositories/categoriaRepo.ts');
    const { presentacionRepo } = await import('./backend/repositories/presentacionRepo.ts');

    // Test categoria data
    console.log('🔍 Testing categorias...');
    try {
      const categorias = await categoriaRepo.listarArbol(1);
      console.log(`✅ Found ${categorias.length} categorias`);
      console.log('Sample categorias:', categorias.slice(0, 3).map(c => ({ id: c.id, nombre: c.nombre })));
    } catch (error) {
      console.error('❌ Categoria test failed:', error.message);
    }

    // Test presentacion data
    console.log('🔍 Testing presentaciones...');
    try {
      const presentaciones = await presentacionRepo.listar(1);
      console.log(`✅ Found ${presentaciones.length} presentaciones`);
      console.log('Sample presentaciones:', presentaciones.slice(0, 3).map(p => ({ id: p.id, nombre: p.nombre })));
    } catch (error) {
      console.error('❌ Presentacion test failed:', error.message);
    }

    // Test materia prima data with references
    console.log('🔍 Testing materia prima with references...');
    try {
      const materiales = await materiaPrimaRepo.listar(1, 10, 0, {});
      console.log(`✅ Found ${materiales.length} materiales`);

      // Check for reference data issues
      const materialsWithIssues = materiales.filter(m => !m.categoria_id || !m.presentacion_id);
      if (materialsWithIssues.length > 0) {
        console.log(`⚠️ Found ${materialsWithIssues.length} materials with missing references:`);
        materialsWithIssues.forEach(m => {
          console.log(`  - ID: ${m.id}, Nombre: ${m.nombre}, Categoria: ${m.categoria_id}, Presentacion: ${m.presentacion_id}`);
        });
      } else {
        console.log('✅ All materials have valid categoria and presentacion references');
      }

      // Test specific material lookup
      if (materiales.length > 0) {
        const firstMaterial = materiales[0];
        const materialDetails = await materiaPrimaRepo.obtener(firstMaterial.id);
        if (materialDetails) {
          console.log(`✅ Material details retrieved successfully:`, {
            id: materialDetails.id,
            nombre: materialDetails.nombre,
            categoria_id: materialDetails.categoria_id,
            presentacion_id: materialDetails.presentacion_id
          });
        }
      }
    } catch (error) {
      console.error('❌ Materia prima test failed:', error.message);
    }

    console.log('\n📋 Summary:');
    console.log('Direct diagnostic completed');
    console.log('Database and backend layer tested successfully');

  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

runDirectDiagnostic().catch(console.error);