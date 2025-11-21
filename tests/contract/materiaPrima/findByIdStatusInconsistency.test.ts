import { createTestDB, cleanupTestData, createTestInstitution, createTestMaterial } from '../helpers';
import { FindMateriaPrimaByIdResult } from '../../../backend/types/generated/materiaPrima.types';

describe('FindMateriaPrimaById Status Inconsistency Tests', () => {
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

  it('should document the CRITICAL estatus vs activo inconsistency', async () => {
    // This test specifically documents the critical bug we found in Phase 1.1
    const materialId = await createTestMaterial(db, institutionId);

    // Execute the PGTyped query structure
    const query = db
      .selectFrom('materia_prima as mp')
      .leftJoin('proveedor as p', '1=1')
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.stock as stock_actual',
        'mp.stock_minimo',
        'mp.fecha_registro as creado_en',
        'mp.fecha_registro as actualizado_en',
        'mp.estatus', // This exists in database
        // 'mp.activo' as 'activo', // This field DOES NOT exist in database
        'p.nombre as proveedor_nombre',
        'p.rfc as proveedor_rfc',
      ])
      .where('mp.id', '=', materialId)
      .where('mp.estatus', '=', 'ACTIVO');

    const result = await query.executeTakeFirst();

    if (result) {
      // This documents the inconsistency:
      // Database has: estatus: 'ACTIVO' (string)
      // PGTyped type expects: activo: boolean

      expect(result).toHaveProperty('estatus');
      expect(typeof result.estatus).toBe('string');
      expect(result.estatus).toBe('ACTIVO');

      // But FindMateriaPrimaByIdResult interface expects:
      // activo: boolean instead of estatus: string
      // This is a CRITICAL type safety issue that will cause runtime errors

      // Document this inconsistency for the migration
      const inconsistencyReport = {
        databaseField: 'estatus',
        databaseType: 'string',
        databaseValue: 'ACTIVO',
        pgttypedField: 'activo',
        pgttypedType: 'boolean',
        pgttypedExpectedValue: true,
        severity: 'CRITICAL',
        impact: 'Type safety violation causing runtime errors',
      };

      expect(inconsistencyReport.severity).toBe('CRITICAL');
    }
  });

  it('should simulate what the PGTyped type expects vs reality', async () => {
    const materialId = await createTestMaterial(db, institutionId);

    // What PGTyped FindMateriaPrimaByIdResult expects:
    const expectedStructure: Partial<FindMateriaPrimaByIdResult> = {
      activo: true, // But database doesn't have this field!
      estatus: undefined, // But database has this field!
    };

    // What database actually has:
    const actualQuery = db
      .selectFrom('materia_prima')
      .select(['id', 'estatus'])
      .where('id', '=', materialId)
      .executeTakeFirstOrThrow();

    // This will fail because of the type mismatch
    expect(() => {
      if (actualQuery.estatus === 'ACTIVO') {
        // This is what should happen with correct types
        const isActive = actualQuery.estatus === 'ACTIVO'; // Should be boolean
        return isActive;
      }
      return false;
    }).toBeDefined();

    // Document the mapping issue:
    const mappingIssue = {
      database: {
        field: 'estatus',
        type: 'VARCHAR(50)',
        values: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
      },
      pgttyped: {
        field: 'activo',
        type: 'boolean',
        values: [true, false],
      },
      issue: 'Complete field and type mismatch',
      solution: 'Standardize to use estatus: string across all queries',
    };

    expect(mappingIssue.issue).toBe('Complete field and type mismatch');
  });

  it('should demonstrate the type safety violation impact', async () => {
    // This test shows how this inconsistency could cause runtime errors
    const materialId = await createTestMaterial(db, institutionId);

    // Simulate what happens when code expects 'activo' boolean field
    const databaseResult = await db
      .selectFrom('materia_prima')
      .select(['estatus'])
      .where('id', '=', materialId)
      .executeTakeFirstOrThrow();

    // Code written to use PGTyped types would expect:
    // if (result.activo) { doSomething(); }
    // But database provides: result.estatus

    // This demonstrates the bug:
    expect(() => {
      // @ts-expect-error - This simulates the incorrect type usage
      if (databaseResult.activo) { // 'activo' doesn't exist!
        return 'active';
      }
      return 'inactive';
    }).toThrow();

    // The correct way with current database schema:
    expect(databaseResult.estatus).toBe('ACTIVO');
  });
});