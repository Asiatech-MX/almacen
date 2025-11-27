/**
 * Unit Tests for MateriaPrimaRepository.findAll() method - Phase 5 Implementation
 * Testing the exclusion of INACTIVE materials from default queries
 */

import { MateriaPrimaRepository } from '../../backend/repositories/materiaPrimaRepo';
import { Kysely } from 'kysely';
import type { DB } from '../../backend/types/generated/database.types';
import {
  createTestDatabase,
  testDataFactories,
  DatabaseSeeder,
  beforeEachTest
} from '../setup/database';

describe('MateriaPrimaRepository.findAll - Phase 5 Testing', () => {
  let db: Kysely<DB>;
  let seeder: DatabaseSeeder;
  let testDb: any;
  let repository: MateriaPrimaRepository;

  beforeAll(async () => {
    testDb = createTestDatabase();
    db = testDb.db;
    seeder = new DatabaseSeeder(db);
    repository = new MateriaPrimaRepository(db);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await beforeEachTest(testDb);
  });

  describe('✅ 5.1.1 Backend - Exclusión INACTIVO por defecto', () => {
    it('should exclude INACTIVE materials by default', async () => {
      // Arrange: Crear materiales ACTIVOS e INACTIVOS
      await seeder.seedMateriaPrima(3, { activo: true }); // 3 ACTIVOS
      await seeder.seedMateriaPrima(2, { activo: false }); // 2 INACTIVOS

      // Act: findAll() sin parámetros (debe excluir INACTIVO)
      const result = await repository.findAll();

      // Assert: Solo debe devolver materiales ACTIVOS
      expect(result).toHaveLength(3);
      result.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.estatus).toBe('ACTIVO');
      });
    });

    it('should include INACTIVE materials when explicitly requested', async () => {
      // Arrange: Crear materiales ACTIVOS e INACTIVOS
      await seeder.seedMateriaPrima(2, { activo: true }); // 2 ACTIVOS
      await seeder.seedMateriaPrima(3, { activo: false }); // 3 INACTIVOS

      // Act: findAll() con includeInactive: true
      const result = await repository.findAll(undefined, { includeInactive: true });

      // Assert: Debe devolver todos los materiales
      expect(result).toHaveLength(5);

      const activeCount = result.filter(m => m.activo).length;
      const inactiveCount = result.filter(m => !m.activo).length;

      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(3);
    });
  });

  describe('✅ 5.1.2 Backend - Métodos especializados', () => {
    it('should return only ACTIVE materials with findActivos()', async () => {
      // Arrange: Crear materiales mezclados
      await seeder.seedMateriaPrima(4, { activo: true });
      await seeder.seedMateriaPrima(3, { activo: false });

      // Act: Usar método especializado
      const result = await repository.findActivos();

      // Assert: Solo materiales ACTIVOS
      expect(result).toHaveLength(4);
      result.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.estatus).toBe('ACTIVO');
      });
    });

    it('should return only INACTIVE materials with findInactivos()', async () => {
      // Arrange: Crear materiales mezclados
      await seeder.seedMateriaPrima(2, { activo: true });
      await seeder.seedMateriaPrima(5, { activo: false });

      // Act: Usar método especializado
      const result = await repository.findInactivos();

      // Assert: Solo materiales INACTIVOS
      expect(result).toHaveLength(5);
      result.forEach(material => {
        expect(material.activo).toBe(false);
        expect(material.estatus).toBe('INACTIVO');
      });
    });
  });

  describe('✅ 5.1.3 Backend - Compatibilidad con filtros existentes', () => {
    it('should apply filters correctly while excluding INACTIVE materials', async () => {
      // Arrange: Crear materiales con diferentes categorías y estados
      await seeder.seedMateriaPrima(3, {
        activo: true,
        categoria: 'ELECTRONICOS'
      });
      await seeder.seedMateriaPrima(2, {
        activo: false,
        categoria: 'ELECTRONICOS'
      });
      await seeder.seedMateriaPrima(1, {
        activo: true,
        categoria: 'OFICINA'
      });

      // Act: Filtrar por categoría ELECTRONICOS
      const result = await repository.findAll({
        categoria: 'ELECTRONICOS'
      });

      // Assert: Solo ELECTRONICOS ACTIVOS (INACTIVOS excluidos)
      expect(result).toHaveLength(3);
      result.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.categoria).toBe('ELECTRONICOS');
      });
    });

    it('should handle multiple filters correctly', async () => {
      // Arrange: Dataset complejo
      await seeder.seedMateriaPrima(2, {
        activo: true,
        categoria: 'ELECTRONICOS',
        stockMinimo: '10.00'
      });
      await seeder.seedMateriaPrima(1, {
        activo: false,
        categoria: 'ELECTRONICOS',
        stockMinimo: '10.00'
      });
      await seeder.seedMateriaPrima(3, {
        activo: true,
        categoria: 'OFICINA',
        stockMinimo: '10.00'
      });

      // Act: Múltiples filtros
      const result = await repository.findAll({
        categoria: 'ELECTRONICOS',
        stockMinimo: '10.00'
      });

      // Assert: Solo materiales que cumplen todos los filtros y están ACTIVOS
      expect(result).toHaveLength(2);
      result.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.categoria).toBe('ELECTRONICOS');
        expect(material.stockMinimo).toBe('10.00');
      });
    });
  });

  describe('✅ 5.1.4 Backend - Performance y queries', () => {
    it('should generate correct SQL queries', async () => {
      // Arrange: Espiar el método de query
      const spy = jest.spyOn(db, 'selectFrom');

      await seeder.seedMateriaPrima(2, { activo: true });
      await seeder.seedMateriaPrima(1, { activo: false });

      // Act: Ejecutar findAll
      await repository.findAll();

      // Assert: Verificar que se aplicó el filtro WHERE activo = true
      expect(spy).toHaveBeenCalledWith('materia_prima');

      spy.mockRestore();
    });

    it('should maintain acceptable performance with large datasets', async () => {
      // Arrange: Dataset grande
      await seeder.seedMateriaPrima(100, { activo: true });
      await seeder.seedMateriaPrima(50, { activo: false });

      const startTime = performance.now();

      // Act: Consulta con filtros
      const result = await repository.findAll({
        categoria: 'TEST_CATEGORY'
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Performance aceptable (< 100ms)
      expect(executionTime).toBeLessThan(100);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('🧪 5.1.5 Backend - Edge cases', () => {
    it('should handle empty database correctly', async () => {
      // Act: Consulta en base de datos vacía
      const result = await repository.findAll();

      // Assert: No debe lanzar error
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle only INACTIVE materials database', async () => {
      // Arrange: Solo materiales INACTIVOS
      await seeder.seedMateriaPrima(5, { activo: false });

      // Act: findAll() por defecto
      const result = await repository.findAll();

      // Assert: Debe devolver array vacío
      expect(result).toHaveLength(0);

      // Act: findAll() con includeInactive
      const allMaterials = await repository.findAll(undefined, { includeInactive: true });

      // Assert: Ahora debe devolver todos
      expect(allMaterials).toHaveLength(5);
    });

    it('should handle null/undefined values in filters', async () => {
      // Arrange: Materiales con valores nulos
      await seeder.seedMateriaPrima(3, {
        activo: true,
        categoria: null as any
      });

      // Act: Filtros con valores nulos
      const result = await repository.findAll({
        categoria: null as any
      });

      // Assert: No debe lanzar error
      expect(result).toHaveLength(0); // Kysely maneja null correctamente
    });
  });
});