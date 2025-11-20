import { createTestDB, cleanupTestData, createTestInstitution, createTestProvider } from '../helpers';
import { FindAllProveedoresResult, FindProveedorByIdResult } from '../../../backend/types/generated/proveedores.types';

describe('Proveedores Status Inconsistency Tests', () => {
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

  it('should document FindAllProveedores missing estatus field', async () => {
    // Create test provider
    const providerId = await createTestProvider(db, institutionId);

    // Execute PGTyped query structure
    const query = db
      .selectFrom('proveedor')
      .select([
        'id',
        'nombre',
        'rfc',
        'telefono',
        'email',
        'domicilio as direccion',
        'fecha_registro as creado_en',
        'fecha_registro as actualizado_en',
        // Note: Query doesn't select 'estatus' field
      ])
      .where('estatus', '=', 'ACTIVO') // But filters by estatus!
      .orderBy('nombre');

    const result = await query.execute();

    expect(result).toHaveLength(1);

    // CRITICAL: FindAllProveedoresResult doesn't include estatus field
    // but query filters by it and database has it
    expect(result[0]).not.toHaveProperty('estatus');

    // The type interface expects:
    const expectedInterface: Partial<FindAllProveedoresResult> = {
      id: expect.any(String),
      nombre: expect.any(String),
      rfc: expect.any(String),
      telefono: expect.any(String),
      email: expect.any(String),
      direccion: expect.any(String),
      creado_en: expect.any(Date),
      actualizado_en: expect.any(Date),
      // Missing: estatus field
    };

    expect(result[0]).toMatchObject(expectedInterface);
  });

  it('should document FindProveedorById estatus vs activo inconsistency', async () => {
    const providerId = await createTestProvider(db, institutionId);

    // Execute PGTyped query structure (simulated)
    const query = db
      .selectFrom('proveedor')
      .select([
        'id',
        'nombre',
        'rfc',
        'telefono',
        'email',
        'domicilio',
        'estatus', // Database has this
        'fecha_registro as creado_en',
        'fecha_registro as actualizado_en',
      ])
      .where('id', '=', providerId)
      .where('estatus', '=', 'ACTIVO');

    const result = await query.executeTakeFirstOrThrow();

    // Database reality
    expect(result).toHaveProperty('estatus');
    expect(typeof result.estatus).toBe('string');
    expect(result.estatus).toBe('ACTIVO');

    // PGTyped type expectation (WRONG)
    // FindProveedorByIdResult expects 'activo: boolean'

    // Document the inconsistency
    const inconsistencyReport = {
      query: 'FindProveedorById',
      databaseField: 'estatus',
      databaseType: 'string',
      databaseValue: 'ACTIVO',
      pgttypedField: 'activo',
      pgttypedType: 'boolean',
      pgttypedExpectedValue: true,
      severity: 'CRITICAL',
      impact: 'Type safety violation and runtime errors',
    };

    expect(inconsistencyReport.severity).toBe('CRITICAL');
  });

  it('should demonstrate the business logic impact', async () => {
    const providerId = await createTestProvider(db, institutionId);

    // Update provider to INACTIVE
    await db
      .updateTable('proveedor')
      .set({ estatus: 'INACTIVO' })
      .where('id', '=', providerId)
      .execute();

    // Query that filters by estatus
    const activeProvidersQuery = db
      .selectFrom('proveedor')
      .selectAll()
      .where('estatus', '=', 'ACTIVO');

    const activeProviders = await activeProvidersQuery.execute();
    expect(activeProviders).toHaveLength(0);

    // But if code was written to use PGTyped types:
    // if (provider.activo) { doSomething(); }
    // This would fail because 'activo' field doesn't exist

    // Database reality
    const providerQuery = db
      .selectFrom('proveedor')
      .select(['id', 'nombre', 'estatus'])
      .where('id', '=', providerId);

    const provider = await providerQuery.executeTakeFirstOrThrow();

    expect(provider.estatus).toBe('INACTIVO');

    // Correct business logic check:
    const isActive = provider.estatus === 'ACTIVO';
    expect(isActive).toBe(false);

    // But PGTyped type would suggest:
    // const isActive = provider.activo; // This would be undefined!
  });

  it('should show type validation failures', async () => {
    const providerId = await createTestProvider(db, institutionId);

    // Get the actual database record
    const dbRecord = await db
      .selectFrom('proveedor')
      .selectAll()
      .where('id', '=', providerId)
      .executeTakeFirstOrThrow();

    // Try to use it with PGTyped type expectations
    expect(() => {
      // This simulates using the FindProveedorByIdResult type
      const typedRecord = dbRecord as FindProveedorByIdResult;

      // This should work according to PGTyped type but fails at runtime
      // @ts-expect-error - Showing the type error
      if (typedRecord.activo) {
        return 'Provider is active';
      }
      return 'Provider is inactive';
    }).not.toThrow(); // But it would return incorrect result

    // The correct way:
    const isActive = dbRecord.estatus === 'ACTIVO';
    expect(isActive).toBe(true);
  });
});