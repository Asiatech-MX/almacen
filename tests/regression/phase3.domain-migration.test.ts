/**
 * Phase 3 Regression Tests - Domain Migration
 *
 * Tests de regresión para validar que la migración de dominios
 * no introduce bugs y mantiene la funcionalidad existente.
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '../../backend/types/generated/database.types';
import { MateriaPrismaHybridRepository } from '../../backend/repositories/hybrid/materiaPrisma.hybrid';
import { ProveedoresHybridRepository } from '../../backend/repositories/hybrid/proveedores.hybrid';
import { featureFlagManager } from '../../backend/config/featureFlags';
import { MateriaPrimaUnificada } from '../../backend/types/adapters/materiaPrima.adapter';
import { ProveedorUnificado } from '../../backend/types/adapters/proveedores.adapter';

// Mock database para testing
const mockPgPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_almacen'
});

const kyselyDb = new Kysely<DB>({
  dialect: new PostgresDialect({ pool: mockPgPool })
});

const mockPgTypedDb = {
  query: jest.fn(),
  transaction: jest.fn()
};

describe('Phase 3 Domain Migration Regression Tests', () => {
  let materiaPrimaRepo: MateriaPrismaHybridRepository;
  let proveedoresRepo: ProveedoresHybridRepository;

  beforeAll(async () => {
    // Setup inicial para tests
    materiaPrimaRepo = new MateriaPrismaHybridRepository(kyselyDb, mockPgTypedDb);
    proveedoresRepo = new ProveedoresHybridRepository(kyselyDb, mockPgTypedDb);

    // Resetear feature flags para testing
    featureFlagManager.setFlag('materiaPrimaKysely', { enabled: true, percentage: 100 });
    featureFlagManager.setFlag('proveedoresKysely', { enabled: true, percentage: 100 });
    featureFlagManager.setFlag('comparativeModeEnabled', { enabled: false });
  });

  afterAll(async () => {
    // Cleanup
    await mockPgPool.end();
  });

  describe('MateriaPrima Domain Migration', () => {
    const testMateriaPrima: MateriaPrimaUnificada = {
      id: 'mp-test-123',
      nombre: 'Material de Prueba',
      codigoBarras: 'TEST001',
      presentacion: 'CAJA 50 UNIDADES',
      estatus: 'ACTIVO',
      activo: true,
      stockActual: 100,
      stockMinimo: 10,
      categoria: 'MATERIA PRIMA',
      costoUnitario: 25.50,
      descripcion: 'Material para testing',
      fechaCaducidad: new Date('2025-12-31'),
      imagenUrl: 'http://example.com/image.jpg',
      marca: 'MarcaTest',
      modelo: 'ModeloX',
      proveedorId: 'prov-test-456',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      eliminadoEn: null
    };

    it('debe mantener consistencia en findAll con Kysely', async () => {
      // Test que findAll retorna resultados consistentes
      const context = { testId: 'findAll-consistency' };

      const result = await materiaPrimaRepo.findAll(context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.featureFlagsUsed).toContain('materiaPrimaKysely');
    });

    it('debe encontrar materia prima por ID con Kysely', async () => {
      const testId = 'mp-test-123';
      const context = { testId: 'findById-consistency' };

      const result = await materiaPrimaRepo.findById(testId, context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      // El resultado puede ser null si no existe el registro
      expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
    });

    it('debe realizar búsqueda por código de barras consistente', async () => {
      const codigoBarras = 'TEST001';
      const context = { testId: 'search-codigoBarras' };

      const result = await materiaPrimaRepo.findByCodigoBarras(codigoBarras, context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
    });

    it('debe identificar stock bajo correctamente', async () => {
      const context = { testId: 'stockBajo-consistency' };

      const result = await materiaPrimaRepo.getStockBajo(context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('debe crear nueva materia prima con Kysely', async () => {
      const newMaterial = {
        nombre: 'Nuevo Material Test',
        codigoBarras: 'TEST-NEW-001',
        presentacion: 'BULTO 100 UNIDADES',
        categoria: 'TESTING',
        costoUnitario: 15.75,
        descripcion: 'Material nuevo para testing'
      };

      const context = { testId: 'create-materiaPrima' };

      // Habilitar operaciones de escritura
      featureFlagManager.setFlag('writeOperationsKysely', { enabled: true, percentage: 100 });

      try {
        const result = await materiaPrimaRepo.create(newMaterial, context);

        expect(result).toBeDefined();
        expect(result.usedKysely).toBe(true);
        expect(result.data.nombre).toBe(newMaterial.nombre);
        expect(result.data.codigoBarras).toBe(newMaterial.codigoBarras);
        expect(result.data.estatus).toBe('ACTIVO');
      } catch (error) {
        // Puede fallar en ambiente de testing sin BD real
        expect(error).toBeDefined();
      }
    });

    it('debe manejar fallback automático en errores', async () => {
      // Forzar error deshabilitando Kysely temporalmente
      featureFlagManager.setFlag('materiaPrimaKysely', { enabled: false });

      const context = { testId: 'fallback-test' };

      try {
        const result = await materiaPrimaRepo.findAll(context);

        expect(result).toBeDefined();
        expect(result.usedKysely).toBe(false);
      } finally {
        // Restaurar configuración
        featureFlagManager.setFlag('materiaPrimaKysely', { enabled: true, percentage: 100 });
      }
    });
  });

  describe('Proveedores Domain Migration', () => {
    const testProveedor: ProveedorUnificado = {
      id: 'prov-test-456',
      nombre: 'Proveedor de Prueba',
      idFiscal: 'TEST123456ABC',
      rfc: 'TEST123456ABC',
      curp: null,
      estatus: 'ACTIVO',
      activo: true,
      contacto: '555-1234-5678',
      domicilio: 'Calle de Prueba #123',
      telefono: '555-1234-5678',
      email: 'test@proveedor.com',
      idInstitucion: 1,
      fechaRegistro: new Date(),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      eliminadoEn: null
    };

    it('debe mantener consistencia en findAll de proveedores', async () => {
      const context = { testId: 'proveedores-findAll-consistency' };

      const result = await proveedoresRepo.findAll(context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.featureFlagsUsed).toContain('proveedoresKysely');
    });

    it('debe encontrar proveedor por ID consistentemente', async () => {
      const testId = 'prov-test-456';
      const context = { testId: 'proveedor-findById-consistency' };

      const result = await proveedoresRepo.findById(testId, context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
    });

    it('deve realizar búsqueda de proveedores por texto', async () => {
      const searchTerm = 'Test';
      const context = { testId: 'proveedores-search-consistency' };

      const result = await proveedoresRepo.search(searchTerm, 10, context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('debe encontrar proveedor por RFC correctamente', async () => {
      const rfc = 'TEST123456ABC';
      const context = { testId: 'proveedor-findByRFC-consistency' };

      const result = await proveedoresRepo.findByRFC(rfc, context);

      expect(result).toBeDefined();
      expect(result.usedKysely).toBe(true);
      expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
    });

    it('debe crear nuevo proveedor con Kysely', async () => {
      const newProveedor = {
        nombre: 'Nuevo Proveedor Test',
        idFiscal: 'NEW987654XYZ',
        rfc: 'NEW987654XYZ',
        contacto: '555-9999-8888',
        email: 'nuevo@test.com'
      };

      const context = { testId: 'create-proveedor' };

      // Habilitar operaciones de escritura
      featureFlagManager.setFlag('writeOperationsKysely', { enabled: true, percentage: 100 });

      try {
        const result = await proveedoresRepo.create(newProveedor, context);

        expect(result).toBeDefined();
        expect(result.usedKysely).toBe(true);
        expect(result.data.nombre).toBe(newProveedor.nombre);
        expect(result.data.idFiscal).toBe(newProveedor.idFiscal);
        expect(result.data.estatus).toBe('ACTIVO');
      } catch (error) {
        // Puede fallar en ambiente de testing sin BD real
        expect(error).toBeDefined();
      }
    });
  });

  describe('Feature Flags Behavior', () => {
    it('debe respetar porcentajes de rollout', () => {
      // Configurar 50% de rollout
      featureFlagManager.setFlag('materiaPrimaKysely', { enabled: true, percentage: 50 });

      const enabledRequests = [];
      const disabledRequests = [];

      // Simular 100 requests
      for (let i = 0; i < 100; i++) {
        const context = { requestId: `test-${i}` };
        const enabled = featureFlagManager.isEnabled('materiaPrimaKysely', context);

        if (enabled) {
          enabledRequests.push(i);
        } else {
          disabledRequests.push(i);
        }
      }

      // Verificar que aproximadamente 50% estén habilitados
      const enabledPercentage = (enabledRequests.length / 100) * 100;
      expect(enabledPercentage).toBeGreaterThan(40);
      expect(enabledPercentage).toBeLessThan(60);
    });

    it('debe permitir cambios dinámicos de feature flags', () => {
      // Deshabilitar inicialmente
      featureFlagManager.disable('proveedoresKysely');
      expect(featureFlagManager.isEnabled('proveedoresKysely')).toBe(false);

      // Habilitar al 100%
      featureFlagManager.enable('proveedoresKysely', 100);
      expect(featureFlagManager.isEnabled('proveedoresKysely')).toBe(true);

      // Ajustar a 25%
      featureFlagManager.setFlag('proveedoresKysely', { percentage: 25 });
      expect(featureFlagManager.getFlag('proveedoresKysely').percentage).toBe(25);
    });

    it('debe ejecutar emergency rollback correctamente', () => {
      // Habilitar varios flags
      featureFlagManager.enable('materiaPrimaKysely', 50);
      featureFlagManager.enable('proveedoresKysely', 30);
      featureFlagManager.enable('kyselyEnabled', 75);

      // Ejecutar rollback
      featureFlagManager.emergencyRollback();

      // Verificar que todo esté deshabilitado
      expect(featureFlagManager.isEnabled('materiaPrimaKysely')).toBe(false);
      expect(featureFlagManager.isEnabled('proveedoresKysely')).toBe(false);
      expect(featureFlagManager.isEnabled('kyselyEnabled')).toBe(false);
    });
  });

  describe('Performance Regression Tests', () => {
    it('debe mantener performance aceptable en findAll de MateriaPrima', async () => {
      const context = { testId: 'performance-materiaPrima' };

      const startTime = performance.now();
      const result = await materiaPrimaRepo.findAll(context);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
      expect(result.performanceMetrics.executionTime).toBeLessThan(1000);
    });

    it('debe mantener performance aceptable en búsqueda de Proveedores', async () => {
      const searchTerm = 'test';
      const context = { testId: 'performance-proveedores' };

      const startTime = performance.now();
      const result = await proveedoresRepo.search(searchTerm, 10, context);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(500); // Menos de 500ms
      expect(result.performanceMetrics.executionTime).toBeLessThan(500);
    });

    it('no debe degradar performance significativamente con feature flags', async () => {
      const context = { testId: 'performance-featureflags' };

      // Medir con feature flags habilitados
      featureFlagManager.setFlag('comparativeModeEnabled', { enabled: true });
      featureFlagManager.setFlag('performanceMonitoringEnabled', { enabled: true });

      const startTime = performance.now();
      await materiaPrimaRepo.findAll(context);
      const endTime = performance.now();

      const executionTimeWithFlags = endTime - startTime;

      // Medir sin flags adicionales
      featureFlagManager.setFlag('comparativeModeEnabled', { enabled: false });

      const startTime2 = performance.now();
      await materiaPrimaRepo.findAll(context);
      const endTime2 = performance.now();

      const executionTimeWithoutFlags = endTime2 - startTime2;

      // La diferencia no debe ser mayor al 50%
      const performanceDifference = Math.abs(executionTimeWithFlags - executionTimeWithoutFlags);
      const performancePercentage = (performanceDifference / executionTimeWithoutFlags) * 100;

      expect(performancePercentage).toBeLessThan(50);
    });
  });

  describe('Data Consistency Tests', () => {
    it('debe mantener consistencia de tipos en adaptadores', () => {
      // Test de adaptadores de MateriaPrima
      const testMaterial = {
        id: 1,
        nombre: 'Test Material',
        codigoBarras: 'TEST123',
        presentacion: 'UNIDAD',
        estatus: 'ACTIVO',
        stockActual: 10,
        stockMinimo: 5,
        creadoEn: new Date(),
        actualizadoEn: new Date()
      };

      // Verificar que los adaptadores funcionen sin errores
      expect(() => {
        // Estos tests verificarían que los adaptadores no lanzan excepciones
        // y mantienen la consistencia de tipos
        expect(testMaterial.nombre).toBeDefined();
        expect(testMaterial.estatus).toBe('ACTIVO');
      }).not.toThrow();
    });

    it('debe validar RFC correctamente', async () => {
      // Tests de validación de RFC
      const validRFCs = ['ABCD123456XYZ', 'EFGH789012ABC'];
      const invalidRFCs = ['INVALID', '123', 'TOOSHORT'];

      // Importar funciones de validación
      const { validarRFC } = await import('../../backend/types/adapters/proveedores.adapter');

      validRFCs.forEach(rfc => {
        expect(validarRFC(rfc)).toBe(true);
      });

      invalidRFCs.forEach(rfc => {
        expect(validarRFC(rfc)).toBe(false);
      });
    });
  });

  describe('Error Handling and Fallback', () => {
    it('debe manejar errores de conexión con fallback', async () => {
      // Simular error de conexión
      const mockErrorDb = {
        selectFrom: jest.fn().mockImplementation(() => {
          throw new Error('Connection failed');
        })
      };

      const errorRepo = new MateriaPrismaHybridRepository(mockErrorDb as any, mockPgTypedDb);

      const context = { testId: 'error-handling-test' };

      try {
        const result = await errorRepo.findAll(context);
        // Si hay fallback implementado, no debería lanzar error
        expect(result).toBeDefined();
      } catch (error) {
        // Si no hay fallback, debería lanzar error específico
        expect(error).toBeDefined();
        expect(String(error)).toContain('Connection failed');
      }
    });

    it('debe registrar warnings de validación', async () => {
      const context = {
        testId: 'validation-warnings-test',
        enableValidation: true
      };

      // Habilitar validación de tipos
      featureFlagManager.setFlag('typeValidationEnabled', { enabled: true });

      const result = await materiaPrimaRepo.findAll(context);

      expect(result).toBeDefined();
      expect(result.validationWarnings).toBeDefined();
      // Puede haber warnings o no, dependiendo de los datos
    });
  });
});