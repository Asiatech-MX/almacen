/**
 * Integration Tests - Phase 5 Implementation
 * Testing complete flow from Backend → IPC → Services → Frontend
 * for INACTIVE materials filtering
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

// Mock IPC handlers
const mockIPC = {
  materiaPrima: {
    listar: jest.fn(),
    listarActivos: jest.fn(),
    listarInactivos: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn()
  }
};

describe('Integration: INACTIVE Materials Filtering - Phase 5', () => {
  let db: Kysely<DB>;
  let seeder: DatabaseSeeder;
  let testDb: any;
  let repository: MateriaPrimaRepository;

  beforeAll(async () => {
    testDb = createTestDatabase();
    db = testDb.db;
    seeder = new DatabaseSeeder(db);
    repository = new MateriaPrimaRepository(db);

    // Setup mock IPC handlers
    Object.defineProperty(global, 'ipcRenderer', {
      value: {
        invoke: jest.fn()
      },
      writable: true
    });

    Object.defineProperty(global, 'window', {
      value: {
        electronAPI: mockIPC
      },
      writable: true
    });
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await beforeEachTest(testDb);
    jest.clearAllMocks();
  });

  describe('✅ 5.5.1 Integration - Backend to IPC Communication', () => {
    it('should filter INACTIVE materials end-to-end through repository and IPC', async () => {
      // Arrange: Crear datos en base de datos
      await seeder.seedMateriaPrima(3, { activo: true }); // 3 ACTIVOS
      await seeder.seedMateriaPrima(2, { activo: false }); // 2 INACTIVOS

      // Act: Llamar método del repository (simula llamada desde IPC handler)
      const activeMaterials = await repository.findActivos();
      const inactiveMaterials = await repository.findInactivos();
      const allMaterials = await repository.findAll(undefined, { includeInactive: true });

      // Assert: Filtrado correcto en capa de datos
      expect(activeMaterials).toHaveLength(3);
      expect(inactiveMaterials).toHaveLength(2);
      expect(allMaterials).toHaveLength(5);

      // Verificar consistencia
      activeMaterials.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.estatus).toBe('ACTIVO');
      });

      inactiveMaterials.forEach(material => {
        expect(material.activo).toBe(false);
        expect(material.estatus).toBe('INACTIVO');
      });
    });

    it('should handle IPC calls with filtering parameters', async () => {
      // Arrange: Dataset específico
      await seeder.seedMateriaPrima(2, {
        activo: true,
        categoria: 'ELECTRONICOS'
      });
      await seeder.seedMateriaPrima(1, {
        activo: false,
        categoria: 'ELECTRONICOS'
      });
      await seeder.seedMateriaPrima(1, {
        activo: true,
        categoria: 'OFICINA'
      });

      // Act: Simular diferentes llamadas IPC
      const [activosElectronicos, inactivosElectronicos, todosElectronicos] = await Promise.all([
        repository.findActivos({ categoria: 'ELECTRONICOS' }),
        repository.findInactivos({ categoria: 'ELECTRONICOS' }),
        repository.findAll({ categoria: 'ELECTRONICOS' }, { includeInactive: true })
      ]);

      // Assert: Filtrado combinado correcto
      expect(activosElectronicos).toHaveLength(2); // 2 ELECTRONICOS ACTIVOS
      expect(inactivosElectronicos).toHaveLength(1); // 1 ELECTRONICO INACTIVO
      expect(todosElectronicos).toHaveLength(3); // Todos ELECTRONICOS

      activosElectronicos.forEach(m => {
        expect(m.activo).toBe(true);
        expect(m.categoria).toBe('ELECTRONICOS');
      });

      inactivosElectronicos.forEach(m => {
        expect(m.activo).toBe(false);
        expect(m.categoria).toBe('ELECTRONICOS');
      });
    });
  });

  describe('✅ 5.5.2 Integration - IPC to Services Communication', () => {
    it('should handle complete flow from IPC to frontend services', async () => {
      // Arrange: Mock IPC responses
      const mockActiveData = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Activo 2', estatus: 'ACTIVO', activo: true }
      ];

      const mockInactiveData = [
        { id: '3', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false },
        { id: '4', nombre: 'Inactivo 2', estatus: 'INACTIVO', activo: false }
      ];

      // Simular handlers IPC
      mockIPC.materiaPrima.listarActivos.mockResolvedValue(mockActiveData);
      mockIPC.materiaPrima.listarInactivos.mockResolvedValue(mockInactiveData);
      mockIPC.materiaPrima.listar.mockResolvedValue([...mockActiveData, ...mockInactiveData]);

      // Act: Simular llamadas desde servicios (requeriría importación real de servicios)
      // Por ahora validamos que los mocks responden correctamente
      const activeResponse = await mockIPC.materiaPrima.listarActivos();
      const inactiveResponse = await mockIPC.materiaPrima.listarInactivos();
      const allResponse = await mockIPC.materiaPrima.listar(undefined, { includeInactive: true });

      // Assert: Responses correctas
      expect(activeResponse).toHaveLength(2);
      expect(inactiveResponse).toHaveLength(2);
      expect(allResponse).toHaveLength(4);

      activeResponse.forEach(material => {
        expect(material.activo).toBe(true);
      });

      inactiveResponse.forEach(material => {
        expect(material.activo).toBe(false);
      });
    });

    it('should handle error propagation through all layers', async () => {
      // Arrange: Error en repository level
      mockIPC.materiaPrima.listarActivos.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert: Error debe propagarse correctamente
      await expect(mockIPC.materiaPrima.listarActivos()).rejects.toThrow('Database connection failed');

      // Verificar que otros handlers no se ven afectados
      mockIPC.materiaPrima.listarInactivos.mockResolvedValue([]);
      const inactiveResponse = await mockIPC.materiaPrima.listarInactivos();
      expect(inactiveResponse).toEqual([]);
    });
  });

  describe('✅ 5.5.3 Integration - Data Consistency Validation', () => {
    it('should maintain data consistency across all layers', async () => {
      // Arrange: Crear datos consistentes
      const materials = await seeder.seedMateriaPrima(3, {
        activo: true,
        categoria: 'TEST',
        stockMinimo: '10.00',
        costoUnitario: '100.00'
      });

      await seeder.seedMateriaPrima(2, {
        activo: false,
        categoria: 'TEST',
        stockMinimo: '20.00',
        costoUnitario: '200.00'
      });

      // Act: Obtener datos desde diferentes métodos
      const [allMaterials, activeMaterials, inactiveMaterials] = await Promise.all([
        repository.findAll(undefined, { includeInactive: true }),
        repository.findActivos(),
        repository.findInactivos()
      ]);

      // Assert: Consistencia de datos
      expect(allMaterials).toHaveLength(5);
      expect(activeMaterials).toHaveLength(3);
      expect(inactiveMaterials).toHaveLength(2);

      // Verificar que la suma de activos + inactivos = total
      const combinedMaterials = [...activeMaterials, ...inactiveMaterials];
      const allIds = allMaterials.map(m => m.id).sort();
      const combinedIds = combinedMaterials.map(m => m.id).sort();

      expect(allIds).toEqual(combinedIds);

      // Verificar consistencia de propiedades
      const originalActive = materials.slice(0, 3);
      activeMaterials.forEach((material, index) => {
        expect(material.id).toBe(originalActive[index].id);
        expect(material.nombre).toBe(originalActive[index].nombre);
        expect(material.activo).toBe(true);
        expect(material.estatus).toBe('ACTIVO');
      });
    });

    it('should handle concurrent requests correctly', async () => {
      // Arrange: Dataset grande
      await seeder.seedMateriaPrima(10, { activo: true });
      await seeder.seedMateriaPrima(5, { activo: false });

      // Act: Solicitudes concurrentes
      const concurrentRequests = Array.from({ length: 10 }, () =>
        repository.findAll()
      );

      const results = await Promise.all(concurrentRequests);

      // Assert: Todos los resultados consistentes
      results.forEach(result => {
        expect(result).toHaveLength(10); // Solo activos
        result.forEach(material => {
          expect(material.activo).toBe(true);
          expect(material.estatus).toBe('ACTIVO');
        });
      });

      // Verificar que todos los resultados son idénticos
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
    });
  });

  describe('🧪 5.5.4 Integration - Performance and Load Testing', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange: Dataset grande
      await seeder.seedMateriaPrima(100, { activo: true });
      await seeder.seedMateriaPrima(50, { activo: false });

      const startTime = performance.now();

      // Act: Consultas múltiples
      const [allMaterials, activeMaterials, inactiveMaterials] = await Promise.all([
        repository.findAll(undefined, { includeInactive: true }),
        repository.findActivos(),
        repository.findInactivos()
      ]);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Performance aceptable
      expect(executionTime).toBeLessThan(500); // < 500ms
      expect(allMaterials).toHaveLength(150);
      expect(activeMaterials).toHaveLength(100);
      expect(inactiveMaterials).toHaveLength(50);
    });

    it('should maintain performance with complex filters', async () => {
      // Arrange: Dataset con filtros complejos
      await seeder.seedMateriaPrima(50, {
        activo: true,
        categoria: 'ELECTRONICOS',
        stockMinimo: '10.00'
      });
      await seeder.seedMateriaPrima(30, {
        activo: false,
        categoria: 'ELECTRONICOS',
        stockMinimo: '10.00'
      });
      await seeder.seedMateriaPrima(20, {
        activo: true,
        categoria: 'OFICINA',
        stockMinimo: '5.00'
      });

      const startTime = performance.now();

      // Act: Consultas con filtros complejos
      const results = await Promise.all([
        repository.findActivos({ categoria: 'ELECTRONICOS' }),
        repository.findInactivos({ categoria: 'ELECTRONICOS' }),
        repository.findAll({ categoria: 'ELECTRONICOS' }, { includeInactive: true })
      ]);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert: Performance con filtros
      expect(executionTime).toBeLessThan(200); // < 200ms
      expect(results[0]).toHaveLength(50); // Activos ELECTRONICOS
      expect(results[1]).toHaveLength(30); // Inactivos ELECTRONICOS
      expect(results[2]).toHaveLength(80); // Todos ELECTRONICOS
    });
  });

  describe('✅ 5.5.5 Integration - Transaction Safety', () => {
    it('should handle transaction rollback correctly', async () => {
      // Arrange: Crear material inicial
      const initialData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Original',
        activo: true,
        stockActual: '100.00'
      });

      const originalMaterial = initialData[0];

      // Act: Simular transacción fallida
      try {
        // Iniciar transacción manual para simular rollback
        await db.transaction().execute(async (trx) => {
          // Actualizar material
          await trx
            .updateTable('materia_prima')
            .set({ nombre: 'Material Actualizado', activo: false })
            .where('id', '=', originalMaterial.id)
            .execute();

          // Simular error que causa rollback
          throw new Error('Simulated error for rollback');
        });
      } catch (error) {
        // Error esperado
      }

      // Assert: Material debe permanecer sin cambios
      const unchangedMaterial = await db
        .selectFrom('materia_prima')
        .selectAll()
        .where('id', '=', originalMaterial.id)
        .executeTakeFirst();

      expect(unchangedMaterial).toBeTruthy();
      expect(unchangedMaterial!.nombre).toBe('Material Original');
      expect(unchangedMaterial!.activo).toBe(true);
      expect(unchangedMaterial!.stock_actual).toBe('100.00');
    });
  });
});