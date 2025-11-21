/**
 * Database setup for testing
 * Test-First Implementation - Phase 2.2
 */

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '../../backend/types/generated/database.types';

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/almacen_test';

export interface TestDatabase {
  db: Kysely<DB>;
  cleanup: () => Promise<void>;
}

// Create test database connection
export function createTestDatabase(): TestDatabase {
  const pool = new Pool({
    connectionString: TEST_DATABASE_URL,
  });

  const db = new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });

  const cleanup = async () => {
    await db.destroy();
    await pool.end();
  };

  return { db, cleanup };
}

// Test data factories
export const testDataFactories = {
  materiaPrima: (overrides: Partial<DB['materiaPrima']> = {}): DB['materiaPrima'] => ({
    id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    nombre: 'Material de Prueba',
    codigoBarras: `${Date.now()}`.padStart(13, '0'),
    presentacion: 'UNIDAD',
    activo: true,
    stockActual: '100.00',
    stockMinimo: '20.00',
    categoria: null,
    costoUnitario: null,
    descripcion: null,
    eliminadoEn: null,
    fechaCaducidad: null,
    imagenUrl: null,
    marca: null,
    modelo: null,
    proveedorId: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    ...overrides,
  }),

  proveedor: (overrides: Partial<DB['proveedor']> = {}): DB['proveedor'] => ({
    id: Math.floor(Math.random() * 1000000),
    nombre: 'Proveedor de Prueba',
    idFiscal: `TEST-${Date.now()}`,
    estatus: 'ACTIVO',
    contacto: null,
    curp: null,
    domicilio: null,
    email: null,
    rfc: null,
    telefono: null,
    idInstitucion: 1,
    fechaRegistro: new Date(),
    ...overrides,
  }),

  institucion: (overrides: Partial<DB['institucion']> = {}): DB['institucion'] => ({
    id: Math.floor(Math.random() * 1000000),
    nombre: 'Institución de Prueba',
    descripcion: 'Descripción de prueba',
    estatus: 'ACTIVO',
    fechaCreacion: new Date(),
    ...overrides,
  }),
};

// Database seeding utilities
export class DatabaseSeeder {
  constructor(private db: Kysely<DB>) {}

  async seedMateriaPrima(
    count: number = 1,
    overrides: Partial<DB['materiaPrima']> = {}
  ): Promise<DB['materiaPrima'][]> {
    const items: DB['materiaPrima'][] = [];

    for (let i = 0; i < count; i++) {
      const item = testDataFactories.materiaPrima({
        ...overrides,
        id: overrides.id || `test-${Date.now()}-${i}`,
        codigoBarras: overrides.codigoBarras || `${Date.now()}${i}`.padStart(13, '0'),
      });

      await this.db.insertInto('materia_prima').values(item).execute();
      items.push(item);
    }

    return items;
  }

  async seedProveedores(
    count: number = 1,
    overrides: Partial<DB['proveedor']> = {}
  ): Promise<DB['proveedor'][]> {
    const items: DB['proveedor'][] = [];

    for (let i = 0; i < count; i++) {
      const item = testDataFactories.proveedor({
        ...overrides,
        id: overrides.id || Math.floor(Math.random() * 1000000) + i,
      });

      await this.db.insertInto('proveedor').values(item).execute();
      items.push(item);
    }

    return items;
  }

  async seedInstitucion(
    overrides: Partial<DB['institucion']> = {}
  ): Promise<DB['institucion']> {
    const item = testDataFactories.institucion(overrides);
    await this.db.insertInto('institucion').values(item).execute();
    return item;
  }

  async cleanup(): Promise<void> {
    // Clean up in proper order to respect foreign key constraints
    await this.db.deleteFrom('materia_prima').execute();
    await this.db.deleteFrom('proveedor').execute();
    await this.db.deleteFrom('institucion').execute();
  }
}

// Jest setup and teardown utilities
export function setupTestDatabase(): () => Promise<TestDatabase> {
  return async () => {
    const testDb = createTestDatabase();
    const seeder = new DatabaseSeeder(testDb.db);

    // Clean up before tests
    await seeder.cleanup();

    return testDb;
  };
}

// BeforeEach hook for individual tests
export async function beforeEachTest(testDb: TestDatabase): Promise<void> {
  const seeder = new DatabaseSeeder(testDb.db);
  await seeder.cleanup();
}