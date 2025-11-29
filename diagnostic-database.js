/**
 * Database diagnostic using MCP PostgreSQL
 * Tests the database layer directly to identify issues
 */

console.log('🎯 Running database diagnostic...');

async function testDatabaseWithMCP() {
  try {
    console.log('📊 Testing database connection and data integrity...');

    // Test 1: Check if we can connect to database
    console.log('1. Testing database connection...');
    // This will be handled by the MCP when called

    // Test 2: Check categorias table
    console.log('2. Testing categorias data...');
    const categoriasQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN activo = true THEN 1 END) as active,
             MIN(id) as min_id,
             MAX(id) as max_id
      FROM categoria
      WHERE institucion_id = 1
    `;

    // Test 3: Check presentaciones table
    console.log('3. Testing presentaciones data...');
    const presentacionesQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN activo = true THEN 1 END) as active,
             MIN(id) as min_id,
             MAX(id) as max_id
      FROM presentacion
      WHERE institucion_id = 1
    `;

    // Test 4: Check materia_prima table for reference issues
    console.log('4. Testing materia_prima reference integrity...');
    const referenceIssuesQuery = `
      SELECT
        COUNT(*) as total_materials,
        COUNT(CASE WHEN categoria_id IS NULL THEN 1 END) as missing_categoria,
        COUNT(CASE WHEN presentacion_id IS NULL THEN 1 END) as missing_presentacion,
        COUNT(CASE WHEN categoria_id NOT IN (SELECT id FROM categoria WHERE institucion_id = 1) THEN 1 END) as invalid_categoria,
        COUNT(CASE WHEN presentacion_id NOT IN (SELECT id FROM presentacion WHERE institucion_id = 1) THEN 1 END) as invalid_presentacion
      FROM materia_prima
      WHERE institucion_id = 1
    `;

    // Test 5: Get sample materials with their references
    console.log('5. Getting sample materials with references...');
    const sampleMaterialsQuery = `
      SELECT
        m.id,
        m.nombre,
        m.codigo_barras,
        m.categoria_id,
        c.nombre as categoria_nombre,
        m.presentacion_id,
        p.nombre as presentacion_nombre
      FROM materia_prima m
      LEFT JOIN categoria c ON m.categoria_id = c.id
      LEFT JOIN presentacion p ON m.presentacion_id = p.id
      WHERE m.institucion_id = 1
      ORDER BY m.id
      LIMIT 5
    `;

    console.log('\n📋 Query Results Summary:');
    console.log('The following queries should be executed:');
    console.log('A. Database connection test');
    console.log('B. Categorias count and validation');
    console.log('C. Presentaciones count and validation');
    console.log('D. Reference integrity analysis');
    console.log('E. Sample materials with joined reference data');

    console.log('\n✅ Database diagnostic structure ready');
    console.log('Ready to execute with PostgreSQL MCP');

    return {
      categoriasQuery,
      presentacionesQuery,
      referenceIssuesQuery,
      sampleMaterialsQuery
    };

  } catch (error) {
    console.error('💥 Database diagnostic failed:', error.message);
    return null;
  }
}

// Execute the diagnostic
testDatabaseWithMCP()
  .then(queries => {
    console.log('\n🔧 Next Steps:');
    console.log('1. Use PostgreSQL MCP to execute the queries');
    console.log('2. Analyze results for reference data issues');
    console.log('3. Check for categoria/presentacion null values');
    console.log('4. Verify foreign key constraints');
    console.log('5. Test image upload functionality separately');
  })
  .catch(console.error);