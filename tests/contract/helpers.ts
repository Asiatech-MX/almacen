import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

// Test database interface
export interface TestDB {
  institucion: {
    id: number;
    nombre: string;
    descripcion: string | null;
    estatus: string;
    fecha_creacion: Date;
  };
  usuario: {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    username: string;
    password_hash: string;
    tipo_usuario: string;
    id_institucion: number;
    estatus: string;
    fecha_registro: Date;
    ultimo_login: Date | null;
  };
  proveedor: {
    id: number;
    id_fiscal: string;
    nombre: string;
    domicilio: string | null;
    telefono: string | null;
    email: string | null;
    contacto: string | null;
    rfc: string | null;
    curp: string | null;
    estatus: string;
    fecha_registro: Date;
    id_institucion: number;
  };
  materia_prima: {
    id: number;
    codigo_barras: string;
    nombre: string;
    marca: string;
    modelo: string;
    presentacion: string;
    stock: number;
    stock_minimo: number;
    estatus: string;
    fecha_registro: Date;
    id_institucion: number;
    imagen_url: string | null;
    unidad_medida: string;
  };
}

// Create test database connection
export function createTestDB(): Kysely<TestDB> {
  return new Kysely<TestDB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      }),
    }),
  });
}

// Clean test data
export async function cleanupTestData(db: Kysely<TestDB>): Promise<void> {
  await db.deleteFrom('materia_prima').execute();
  await db.deleteFrom('proveedor').execute();
  await db.deleteFrom('usuario').execute();
  await db.deleteFrom('institucion').where('nombre', 'like', 'TEST_%').execute();
}

// Create test institution
export async function createTestInstitution(db: Kysely<TestDB>, name: string = 'TEST_INSTITUTION'): Promise<number> {
  const result = await db
    .insertInto('institucion')
    .values({
      nombre: name,
      descripcion: 'Test institution for contract testing',
      estatus: 'ACTIVO',
      fecha_creacion: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return result.id;
}

// Create test provider
export async function createTestProvider(db: Kysely<TestDB>, institutionId: number, name: string = 'TEST_PROVIDER'): Promise<number> {
  const result = await db
    .insertInto('proveedor')
    .values({
      id_fiscal: `TEST_FISCAL_${Date.now()}`,
      nombre: name,
      domicilio: 'Test Address',
      telefono: '1234567890',
      email: 'test@provider.com',
      rfc: 'TEST123456789',
      estatus: 'ACTIVO',
      fecha_registro: new Date(),
      id_institucion: institutionId,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return result.id;
}

// Create test material
export async function createTestMaterial(db: Kysely<TestDB>, institutionId: number, name: string = 'TEST_MATERIAL'): Promise<number> {
  const result = await db
    .insertInto('materia_prima')
    .values({
      codigo_barras: `TEST_BARCODE_${Date.now()}`,
      nombre: name,
      marca: 'TEST_BRAND',
      modelo: 'TEST_MODEL',
      presentacion: 'TEST_PRESENTATION',
      stock: 100,
      stock_minimo: 10,
      estatus: 'ACTIVO',
      fecha_registro: new Date(),
      id_institucion: institutionId,
      imagen_url: null,
      unidad_medida: 'PIEZA',
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  return result.id;
}