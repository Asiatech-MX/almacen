import { createTestDB, cleanupTestData, createTestInstitution, createTestMaterial } from '../helpers';
import { FindAllMateriaPrimaResult } from '../../../backend/types/generated/materiaPrima.types';

describe('FindAllMateriaPrima Contract Tests', () => {
  let db: ReturnType<typeof createTestDB>;
  let institutionId: number;

  beforeAll(async () => {
    db = createTestDB();
    await cleanupTestData(db);
    institutionId = await createTestInstitution(db);
  });

  afterAll(async () => {
    await cleanupTestData(db);
    await db.destroy();
  });

  beforeEach(async () => {
    await cleanupTestData(db);
    institutionId = await createTestInstitution(db);
  });

  it('should return empty array when no materials exist', async () => {
    // This query simulates the PGTyped query structure
    const query = db
      .selectFrom('materia_prima as mp')
      .leftJoin('proveedor as p', '1=1') // Simulating the placeholder join
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.stock as stock', // Note: PGTyped generates stock_actual but query uses stock
        'mp.stock_minimo',
        db.selectFrom(() => db.selectFrom('materia_prima').select('id'))
          .select(db.selectFrom('materia_prima').select('id').as('costo_unitario'))
          .as('costo_unitario'), // Simulating hardcoded 0
        'mp.fecha_registro as creado_en',
        'mp.fecha_registro as actualizado_en',
        'mp.estatus',
        'p.nombre as proveedor_nombre',
        'p.rfc as proveedor_rfc',
      ])
      .orderBy('mp.nombre');

    const result = await query.execute();

    expect(result).toEqual([]);
  });

  it('should return materials with correct structure when materials exist', async () => {
    // Create test material
    const materialId = await createTestMaterial(db, institutionId);

    // Execute the same query structure as PGTyped
    const query = db
      .selectFrom('materia_prima as mp')
      .leftJoin('proveedor as p', '1=1') // Simulating the placeholder join
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.stock as stock',
        'mp.stock_minimo',
        db.selectFrom(() => db.selectFrom('materia_prima').select('id'))
          .select(db.selectFrom('materia_prima').select('id').as('costo_unitario'))
          .as('costo_unitario'),
        'mp.fecha_registro as creado_en',
        'mp.fecha_registro as actualizado_en',
        'mp.estatus',
        'p.nombre as proveedor_nombre',
        'p.rfc as proveedor_rfc',
      ])
      .orderBy('mp.nombre');

    const result = await query.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<FindAllMateriaPrimaResult>({
      id: expect.any(String),
      codigo_barras: expect.stringMatching(/^TEST_BARCODE_\d+$/),
      nombre: 'TEST_MATERIAL',
      marca: 'TEST_BRAND',
      modelo: 'TEST_MODEL',
      presentacion: 'TEST_PRESENTATION',
      stock_actual: 100, // This discrepancy is the issue we identified
      stock_minimo: 10,
      costo_unitario: expect.any(Number), // Should be 0 according to query
      estatus: 'ACTIVO',
      proveedor_nombre: null,
      proveedor_rfc: null,
      creado_en: expect.any(Date),
      actualizado_en: expect.any(Date),
    });
  });

  it('should detect the critical inconsistency: estatus field type', async () => {
    // This test documents the type inconsistency we found in Phase 1.1
    await createTestMaterial(db, institutionId);

    const query = db
      .selectFrom('materia_prima')
      .select(['estatus'])
      .executeTakeFirstOrThrow();

    // Database stores estatus as string ('ACTIVO'/'INACTIVO')
    expect(typeof query.estatus).toBe('string');
    expect(query.estatus).toBe('ACTIVO');

    // But some PGTyped types expect 'activo' boolean field
    // This inconsistency will be fixed in the migration
  });

  it('should identify missing schema fields used in queries', async () => {
    // This test documents the schema drift issues
    const materialId = await createTestMaterial(db, institutionId);

    // Query actual schema to confirm missing fields
    const schemaFields = await db
      .selectFrom('materia_prima')
      .selectAll()
      .where('id', '=', materialId)
      .executeTakeFirstOrThrow();

    // These fields are referenced in queries but don't exist in schema
    expect(schemaFields).not.toHaveProperty('proveedor_id');
    expect(schemaFields).not.toHaveProperty('categoria');
    expect(schemaFields).not.toHaveProperty('costo_unitario');
    expect(schemaFields).not.toHaveProperty('descripcion');
    expect(schemaFields).not.toHaveProperty('fecha_caducidad');

    // But query types expect these fields
    // This will be fixed in the migration
  });
});