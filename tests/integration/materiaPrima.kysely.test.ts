/**
 * Integration Tests for Materia Prima queries using Kysely
 * Tests-First Implementation - Phase 2.2
 */

import { Kysely } from 'kysely';
import type { DB } from '../../backend/types/generated/database.types';
import {
  createTestDatabase,
  testDataFactories,
  DatabaseSeeder,
  beforeEachTest
} from '../setup/database';

// Import adapters for testing
import {
  adaptKyselyMateriaPrisma,
  MateriaPrimaUnificada
} from '../../backend/types/adapters/materiaPrima.adapter';

describe('Materia Prima Kysely Integration Tests', () => {
  let db: Kysely<DB>;
  let seeder: DatabaseSeeder;
  let testDb: any;

  beforeAll(async () => {
    testDb = createTestDatabase();
    db = testDb.db;
    seeder = new DatabaseSeeder(db);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await beforeEachTest(testDb);
  });

  describe('FindAll Materia Prima Query', () => {
    it('should return all materia prima records', async () => {
      // Arrange: Seed test data
      const testData = await seeder.seedMateriaPrima(3);

      // Act: Execute query using Kysely
      const results = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .execute();

      // Assert
      expect(results).toHaveLength(3);

      // Test adapter conversion
      const adaptedResults = results.map(adaptKyselyMateriaPrisma);

      adaptedResults.forEach((result, index) => {
        expect(result).toMatchObject<MateriaPrimaUnificada>({
          id: expect.any(String),
          nombre: expect.any(String),
          codigoBarras: expect.any(String),
          presentacion: expect.any(String),
          estatus: expect.any(String), // ✅ Should be 'ACTIVO' or 'INACTIVO'
          activo: expect.any(Boolean), // ✅ Should be boolean
          stockActual: expect.any(Number), // ✅ Should be converted to number
          stockMinimo: expect.any(Number), // ✅ Should be converted to number
        });

        // Verify specific test data
        expect(result.id).toBe(testData[index].id);
        expect(result.nombre).toBe(testData[index].nombre);
        expect(result.codigoBarras).toBe(testData[index].codigoBarras);
      });
    });

    it('should handle empty result set', async () => {
      // Act: Query with no data
      const results = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .execute();

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  describe('Find Materia Prima by ID', () => {
    it('should find materia prima by ID', async () => {
      // Arrange: Seed test data
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Específico',
        activo: false
      });

      // Act: Find by ID
      const result = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('id', '=', testData[0].id)
        .executeTakeFirst();

      // Assert
      expect(result).toBeTruthy();
      expect(result?.id).toBe(testData[0].id);
      expect(result?.nombre).toBe('Material Específico');
      expect(result?.activo).toBe(false);

      // Test adapter conversion
      const adapted = adaptKyselyMateriaPrisma(result!);
      expect(adapted.estatus).toBe('INACTIVO'); // ✅ Converts false to 'INACTIVO'
      expect(adapted.activo).toBe(false);
      expect(adapted.stockActual).toBe(Number(testData[0].stockActual));
    });

    it('should return null for non-existent ID', async () => {
      // Act: Find non-existent ID
      const result = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('id', '=', 'non-existent-id')
        .executeTakeFirst();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Find Materia Prima by Código de Barras', () => {
    it('should find materia prima by código de barras', async () => {
      // Arrange: Seed test data with specific barcode
      const specificBarcode = '1234567890123';
      await seeder.seedMateriaPrima(1, {
        codigoBarras: specificBarcode,
        nombre: 'Material por Código'
      });

      // Act: Find by barcode
      const result = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('codigoBarras', '=', specificBarcode)
        .executeTakeFirst();

      // Assert
      expect(result).toBeTruthy();
      expect(result?.codigoBarras).toBe(specificBarcode);
      expect(result?.nombre).toBe('Material por Código');
    });

    it('should be case sensitive for barcode search', async () => {
      // Arrange: Seed test data
      const barcode = 'ABC123456789';
      await seeder.seedMateriaPrima(1, { codigoBarras: barcode });

      // Act & Assert: Different case should not match
      const wrongCaseResult = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('codigoBarras', '=', barcode.toLowerCase())
        .executeTakeFirst();

      expect(wrongCaseResult).toBeNull();

      // Correct case should match
      const correctCaseResult = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('codigoBarras', '=', barcode)
        .executeTakeFirst();

      expect(correctCaseResult).toBeTruthy();
    });
  });

  describe('Stock bajo (Low Stock) Query', () => {
    it('should return materia prima with stock below minimum', async () => {
      // Arrange: Seed test data with low stock
      await seeder.seedMateriaPrima(1, {
        nombre: 'Material Stock Bajo',
        stockActual: '5.00',
        stockMinimo: '20.00'
      });

      await seeder.seedMateriaPrima(1, {
        nombre: 'Material Stock Normal',
        stockActual: '50.00',
        stockMinimo: '20.00'
      });

      // Act: Query for low stock items
      const results = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('stockActual', '<', 'stockMinimo')
        .execute();

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].nombre).toBe('Material Stock Bajo');

      const adapted = adaptKyselyMateriaPrisma(results[0]);
      expect(adapted.stockActual).toBe(5);
      expect(adapted.stockMinimo).toBe(20);
      expect(adapted.stockActual).toBeLessThan(adapted.stockMinimo);
    });

    it('should not return items with adequate stock', async () => {
      // Arrange: Seed test data with adequate stock
      await seeder.seedMateriaPrima(3, {
        stockActual: '100.00',
        stockMinimo: '20.00'
      });

      // Act: Query for low stock items
      const results = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('stockActual', '<', 'stockMinimo')
        .execute();

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  describe('Filter by Status', () => {
    it('should filter by activo = true', async () => {
      // Arrange: Seed mixed status data
      await seeder.seedMateriaPrima(2, { activo: true });
      await seeder.seedMateriaPrima(1, { activo: false });

      // Act: Query active items
      const results = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('activo', '=', true)
        .execute();

      // Assert
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.activo).toBe(true);

        const adapted = adaptKyselyMateriaPrisma(result);
        expect(adapted.estatus).toBe('ACTIVO');
        expect(adapted.activo).toBe(true);
      });
    });

    it('should filter by activo = false', async () => {
      // Arrange: Seed mixed status data
      await seeder.seedMateriaPrima(1, { activo: true });
      await seeder.seedMateriaPrima(2, { activo: false });

      // Act: Query inactive items
      const results = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('activo', '=', false)
        .execute();

      // Assert
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.activo).toBe(false);

        const adapted = adaptKyselyMateriaPrisma(result);
        expect(adapted.estatus).toBe('INACTIVO');
        expect(adapted.activo).toBe(false);
      });
    });
  });

  describe('Create Materia Prima', () => {
    it('should create new materia prima record', async () => {
      // Arrange: Test data
      const newMaterial = testDataFactories.materiaPrima({
        nombre: 'Nuevo Material',
        codigoBarras: '9999999999999',
        presentacion: 'LITRO',
        activo: true,
        stockActual: '25.50',
        stockMinimo: '10.00'
      });

      // Act: Insert record
      const result = await db
        .insertInto('materiaPrima')
        .values(newMaterial)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Assert
      expect(result.id).toBe(newMaterial.id);
      expect(result.nombre).toBe('Nuevo Material');
      expect(result.codigoBarras).toBe('9999999999999');
      expect(result.activo).toBe(true);
      expect(result.stockActual).toBe('25.50');
      expect(result.stockMinimo).toBe('10.00');

      // Test adapter
      const adapted = adaptKyselyMateriaPrisma(result);
      expect(adapted.estatus).toBe('ACTIVO');
      expect(adapted.stockActual).toBe(25.50);
      expect(adapted.stockMinimo).toBe(10);
    });
  });

  describe('Update Materia Prima', () => {
    it('should update existing materia prima record', async () => {
      // Arrange: Seed test data
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Nombre Original',
        activo: true
      });

      // Act: Update record
      const updatedResult = await db
        .updateTable('materiaPrima')
        .set({
          nombre: 'Nombre Actualizado',
          activo: false,
          actualizadoEn: new Date()
        })
        .where('id', '=', testData[0].id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Assert
      expect(updatedResult.id).toBe(testData[0].id);
      expect(updatedResult.nombre).toBe('Nombre Actualizado');
      expect(updatedResult.activo).toBe(false);

      // Test adapter
      const adapted = adaptKyselyMateriaPrisma(updatedResult);
      expect(adapted.estatus).toBe('INACTIVO');
      expect(adapted.activo).toBe(false);
    });
  });

  describe('Delete Materia Prima', () => {
    it('should delete materia prima record', async () => {
      // Arrange: Seed test data
      const testData = await seeder.seedMateriaPrima(1);

      // Act: Delete record
      const deleteResult = await db
        .deleteFrom('materiaPrima')
        .where('id', '=', testData[0].id)
        .returningAll()
        .executeTakeFirst();

      // Assert
      expect(deleteResult).toBeTruthy();
      expect(deleteResult?.id).toBe(testData[0].id);

      // Verify deletion
      const findResult = await db
        .selectFrom('materiaPrima')
        .selectAll()
        .where('id', '=', testData[0].id)
        .executeTakeFirst();

      expect(findResult).toBeNull();
    });
  });
});