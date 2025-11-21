/**
 * Unit Tests for MateriaPrimaRepository.delete() method
 * Phase 4: Testing Unitario - Fix Eliminación Materiales INACTIVOS Issue #4
 */

import { MateriaPrimaRepository } from '../../backend/repositories/materiaPrimaRepo';
import { Kysely, Transaction } from 'kysely';
import type { DB } from '../../backend/types/generated/database.types';
import type { Database } from '../../backend/types/database';
import {
  createTestDatabase,
  testDataFactories,
  DatabaseSeeder,
  beforeEachTest
} from '../setup/database';

describe('MateriaPrimaRepository.delete', () => {
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

  describe('✅ 4.1 Eliminar material INACTIVO con stock = 0', () => {
    it('should delete INACTIVE material with zero stock', async () => {
      // Arrange: Crear material INACTIVO con stock = 0
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Inactivo Test',
        activo: false,
        stockActual: '0.00',
        stockMinimo: '10.00'
      });

      const materialId = testData[0].id;

      // Act: Eliminar el material
      await repository.delete(materialId, 'test-user-123');

      // Assert: Verificar que el material fue marcado como eliminado
      const deletedMaterial = await db
        .selectFrom('materiaPrimaMigration')
        .selectAll()
        .where('id', '=', materialId)
        .executeTakeFirst();

      expect(deletedMaterial).toBeTruthy();
      expect(deletedMaterial!.activo).toBe(false); // Ya estaba inactivo, debe permanecer así
      expect(deletedMaterial!.eliminadoEn).toBeTruthy();
      expect(deletedMaterial!.actualizadoEn).toBeTruthy();

      // Verificar que la auditoría se registró en la base de datos
      const auditoriaRecord = await db
        .selectFrom('materiaPrimaAuditoria')
        .selectAll()
        .where('materiaPrimaId', '=', materialId)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeTruthy();
      expect(auditoriaRecord!.materiaPrimaId).toBe(materialId);
      expect(auditoriaRecord!.accion).toBe('DELETE');
      expect(auditoriaRecord!.usuarioId).toBe('test-user-123');
      
      // Verificar datos anteriores en auditoría
      const datosAnteriores = JSON.parse(auditoriaRecord!.datos_anteriores || '{}');
      expect(datosAnteriores.id).toBe(materialId);
      expect(datosAnteriores.nombre).toBe('Material Inactivo Test');
      expect(datosAnteriores.activo).toBe(false);
      expect(datosAnteriores.stockActual).toBe('0.00');
    });
  });

  describe('✅ 4.2 Eliminar material ACTIVO con stock = 0 (regresión)', () => {
    it('should delete ACTIVE material with zero stock', async () => {
      // Arrange: Crear material ACTIVO con stock = 0
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Activo Test',
        activo: true,
        stockActual: '0.00',
        stockMinimo: '10.00'
      });

      const materialId = testData[0].id;

      // Act: Eliminar el material
      await repository.delete(materialId, 'test-user-456');

      // Assert: Verificar que el material fue marcado como eliminado
      const deletedMaterial = await db
        .selectFrom('materiaPrimaMigration')
        .selectAll()
        .where('id', '=', materialId)
        .executeTakeFirst();

      expect(deletedMaterial).toBeTruthy();
      expect(deletedMaterial!.activo).toBe(false); // Debe cambiar a false
      expect(deletedMaterial!.eliminado_en).toBeTruthy();
      expect(deletedMaterial!.actualizado_en).toBeTruthy();

      // Verificar que la auditoría se registró en la base de datos
      const auditoriaRecord = await db
        .selectFrom('materiaPrimaAuditoria')
        .selectAll()
        .where('materiaPrimaId', '=', materialId)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeTruthy();
      expect(auditoriaRecord!.materia_prima_id).toBe(materialId);
      expect(auditoriaRecord!.accion).toBe('DELETE');
      expect(auditoriaRecord!.usuario_id).toBe('test-user-456');
      
      // Verificar datos anteriores en auditoría
      const datosAnteriores = JSON.parse(auditoriaRecord!.datos_anteriores || '{}');
      expect(datosAnteriores.id).toBe(materialId);
      expect(datosAnteriores.nombre).toBe('Material Activo Test');
      expect(datosAnteriores.activo).toBe(true); // Estado original
      expect(datosAnteriores.stockActual).toBe('0.00');
    });
  });

  describe('✅ 4.3 Intentar eliminar material INACTIVO con stock > 0 (debe fallar)', () => {
    it('should reject deletion of INACTIVE material with stock > 0', async () => {
      // Arrange: Crear material INACTIVO con stock > 0
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Inactivo con Stock',
        activo: false,
        stockActual: '50.00',
        stockMinimo: '10.00'
      });

      const materialId = testData[0].id;

      // Act & Assert: Intentar eliminar debe lanzar error
      await expect(
        repository.delete(materialId, 'test-user-789')
      ).rejects.toThrow('No se puede eliminar un material con stock disponible');

      // Verificar que el material no fue modificado
      const unchangedMaterial = await db
        .selectFrom('materia_prima_migration')
        .selectAll()
        .where('id', '=', materialId)
        .executeTakeFirst();

      expect(unchangedMaterial).toBeTruthy();
      expect(unchangedMaterial!.activo).toBe(false);
      expect(unchangedMaterial!.eliminadoEn).toBeNull();
      expect(unchangedMaterial!.stockActual).toBe('50.00');

      // Verificar que no se registró auditoría
      const auditoriaRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', materialId)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeFalsy();
    });
  });

  describe('✅ 4.4 Intentar eliminar material INACTIVO que no existe (debe fallar)', () => {
    it('should reject deletion of non-existent material', async () => {
      // Arrange: ID de material que no existe
      const nonExistentId = 'non-existent-material-id';

      // Act & Assert: Intentar eliminar debe lanzar error
      await expect(
        repository.delete(nonExistentId, 'test-user-999')
      ).rejects.toThrow('Material no encontrado');

      // Verificar que no se registró auditoría
      const auditoriaRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', nonExistentId)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeFalsy();
    });
  });

  describe('✅ 4.5 Validar auditoría en todos los casos', () => {
    it('should register audit trail correctly for successful deletion', async () => {
      // Arrange: Crear material para eliminar exitosamente
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material Auditoría Test',
        activo: false,
        stockActual: '0.00'
      });

      const materialId = testData[0].id;
      const usuarioId = 'audit-test-user';

      // Act: Eliminar el material
      await repository.delete(materialId, usuarioId);

      // Assert: Verificar auditoría completa en base de datos
      const auditoriaRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', materialId)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeTruthy();
      expect(auditoriaRecord!.materia_prima_id).toBe(materialId);
      expect(auditoriaRecord!.accion).toBe('DELETE');
      expect(auditoriaRecord!.usuario_id).toBe(usuarioId);
      
      // Verificar datos anteriores en auditoría
      const datosAnteriores = JSON.parse(auditoriaRecord!.datos_anteriores || '{}');
      expect(datosAnteriores.id).toBe(materialId);
      expect(datosAnteriores.nombre).toBe('Material Auditoría Test');
      expect(datosAnteriores.activo).toBe(false);
      expect(datosAnteriores.stockActual).toBe('0.00');
      
      // Verificar que datos nuevos es null para DELETE
      expect(auditoriaRecord!.datos_nuevos).toBeNull();
    });

    it('should not register audit trail for failed deletion due to stock', async () => {
      // Arrange: Crear material con stock > 0
      const testData = await seeder.seedMateriaPrima(1, {
        nombre: 'Material con Stock',
        activo: false,
        stockActual: '100.00'
      });

      // Act & Assert: Intentar eliminar debe fallar
      await expect(
        repository.delete(testData[0].id, 'test-user')
      ).rejects.toThrow();

      // Assert: Verificar que no se registró auditoría
      const auditoriaRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', testData[0].id)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeFalsy();
    });

    it('should not register audit trail for failed deletion due to not found', async () => {
      // Act & Assert: Intentar eliminar material inexistente debe fallar
      await expect(
        repository.delete('non-existent-id', 'test-user')
      ).rejects.toThrow();

      // Assert: Verificar que no se registró auditoría
      const auditoriaRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', 'non-existent-id')
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeFalsy();
    });
  });

  describe('🧪 Casos adicionales de borde', () => {
    it('should handle deletion with null usuarioId', async () => {
      // Arrange: Crear material sin usuario
      const testData = await seeder.seedMateriaPrima(1, {
        activo: false,
        stockActual: '0.00'
      });

      // Act: Eliminar sin usuarioId
      await repository.delete(testData[0].id);

      // Assert: Verificar auditoría con usuarioId null/undefined
      const auditoriaRecord = await db
        .selectFrom('materia_prima_auditoria')
        .selectAll()
        .where('materia_prima_id', '=', testData[0].id)
        .where('accion', '=', 'DELETE')
        .executeTakeFirst();

      expect(auditoriaRecord).toBeTruthy();
      expect(auditoriaRecord!.usuario_id).toBeNull(); // Debe ser null cuando no se proporciona usuarioId
    });

    it('should handle transaction rollback on error', async () => {
      // Arrange: Crear material con stock > 0
      const testData = await seeder.seedMateriaPrima(1, {
        activo: false,
        stockActual: '10.00'
      });

      const originalMaterial = await db
        .selectFrom('materia_prima_migration')
        .selectAll()
        .where('id', '=', testData[0].id)
        .executeTakeFirst();

      // Act: Intentar eliminar (debe fallar)
      await expect(
        repository.delete(testData[0].id, 'test-user')
      ).rejects.toThrow();

      // Assert: Verificar que no hubo cambios parciales
      const unchangedMaterial = await db
        .selectFrom('materia_prima_migration')
        .selectAll()
        .where('id', '=', testData[0].id)
        .executeTakeFirst();

      expect(unchangedMaterial).toEqual(originalMaterial);
    });
  });
});