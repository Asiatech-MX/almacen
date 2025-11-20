/**
 * Tests para MateriaPrima adapters
 * Tests-First Implementation - Phase 2.2
 */

import {
  MateriaPrimaUnificada,
  adaptKyselyMateriaPrisma,
  adaptLegacyMateriaPrisma,
  adaptToKyselyMateriaPrisma,
  validateMateriaPrismaConsistency
} from '../../backend/types/adapters/materiaPrima.adapter';

import type { MateriaPrima, MateriaPrimaLegacy20251114 } from '../../backend/types/generated/database.types';

describe('MateriaPrima Adapters', () => {

  describe('adaptKyselyMateriaPrisma', () => {
    it('should convert Kysely MateriaPrima to unified interface', () => {
      // Arrange: Mock Kysely data
      const kyselyMock: MateriaPrima = {
        id: 'test-uuid-123',
        nombre: 'Material de Prueba',
        codigoBarras: '1234567890123',
        presentacion: 'CAJA',
        activo: true,
        stockActual: '100.50',
        stockMinimo: '20.00',
        categoria: 'ELECTRONICA',
        costoUnitario: '150.75',
        descripcion: 'Descripción de prueba',
        fechaCaducidad: new Date('2025-12-31'),
        imagenUrl: 'http://example.com/image.jpg',
        marca: 'MarcaTest',
        modelo: 'ModeloTest',
        proveedorId: 'prov-uuid-456',
        creadoEn: new Date('2025-01-01'),
        actualizadoEn: new Date('2025-01-15'),
        eliminadoEn: null
      };

      // Act
      const result = adaptKyselyMateriaPrisma(kyselyMock);

      // Assert
      expect(result).toEqual<MateriaPrimaUnificada>({
        id: 'test-uuid-123',
        nombre: 'Material de Prueba',
        codigoBarras: '1234567890123',
        presentacion: 'CAJA',
        estatus: 'ACTIVO', // ✅ Converts boolean to string
        activo: true, // ✅ Maintains compatibility
        stockActual: 100.50, // ✅ Converts string to number
        stockMinimo: 20.00,
        categoria: 'ELECTRONICA',
        costoUnitario: 150.75,
        descripcion: 'Descripción de prueba',
        fechaCaducidad: new Date('2025-12-31'),
        imagenUrl: 'http://example.com/image.jpg',
        marca: 'MarcaTest',
        modelo: 'ModeloTest',
        proveedorId: 'prov-uuid-456',
        creadoEn: new Date('2025-01-01'),
        actualizadoEn: new Date('2025-01-15'),
        eliminadoEn: null
      });
    });

    it('should handle null values correctly', () => {
      // Arrange: Mock with null values
      const kyselyMock: MateriaPrima = {
        id: 'test-uuid-null',
        nombre: 'Material Nulo',
        codigoBarras: '0000000000000',
        presentacion: 'UNIDAD',
        activo: false,
        stockActual: '0.00',
        stockMinimo: '0.00',
        categoria: null,
        costoUnitario: null,
        descripcion: null,
        fechaCaducidad: null,
        imagenUrl: null,
        marca: null,
        modelo: null,
        proveedorId: null,
        creadoEn: null,
        actualizadoEn: null,
        eliminadoEn: null
      };

      // Act
      const result = adaptKyselyMateriaPrisma(kyselyMock);

      // Assert
      expect(result.estatus).toBe('INACTIVO'); // ✅ Converts false to 'INACTIVO'
      expect(result.activo).toBe(false);
      expect(result.stockActual).toBe(0);
      expect(result.stockMinimo).toBe(0);
      expect(result.categoria).toBeNull();
      expect(result.costoUnitario).toBeNull();
    });
  });

  describe('adaptLegacyMateriaPrisma', () => {
    it('should convert Legacy MateriaPrima to unified interface', () => {
      // Arrange: Mock Legacy data
      const legacyMock: MateriaPrimaLegacy20251114 = {
        id: 123,
        nombre: 'Material Legacy',
        codigoBarras: '9876543210987',
        presentacion: 'BULTO',
        estatus: 'SUSPENDIDO', // ✅ Already string
        activo: false,
        stock: '500.25',
        stockMinimo: '50.00',
        categoria: 'QUIMICOS',
        costoUnitario: '200.00',
        descripcion: 'Legacy description',
        fechaCaducidad: new Date('2025-06-30'),
        imagenUrl: null,
        marca: 'LegacyBrand',
        modelo: 'LegacyModel',
        proveedorId: 'legacy-prov-789',
        fechaRegistro: new Date('2024-01-01'),
        actualizadoEn: new Date('2024-12-31'),
        eliminadoEn: null,
        idInstitucion: 1,
        unidadMedida: 'KG'
      };

      // Act
      const result = adaptLegacyMateriaPrisma(legacyMock);

      // Assert
      expect(result).toEqual<MateriaPrimaUnificada>({
        id: '123', // ✅ Converts number to string
        nombre: 'Material Legacy',
        codigoBarras: '9876543210987',
        presentacion: 'BULTO',
        estatus: 'SUSPENDIDO', // ✅ Preserves string status
        activo: false,
        stockActual: 500.25, // ✅ Uses stock field
        stockMinimo: 50.00,
        categoria: 'QUIMICOS',
        costoUnitario: 200.00,
        descripcion: 'Legacy description',
        fechaCaducidad: new Date('2025-06-30'),
        imagenUrl: null,
        marca: 'LegacyBrand',
        modelo: 'LegacyModel',
        proveedorId: 'legacy-prov-789',
        creadoEn: new Date('2024-01-01'), // ✅ Maps fechaRegistro
        actualizadoEn: new Date('2024-12-31'),
        eliminadoEn: null
      });
    });
  });

  describe('adaptToKyselyMateriaPrisma', () => {
    it('should convert unified interface to Kysely format', () => {
      // Arrange: Mock unified data
      const unifiedMock: Partial<MateriaPrimaUnificada> = {
        nombre: 'Para Kysely',
        codigoBarras: '1111111111111',
        presentacion: 'LITRO',
        estatus: 'INACTIVO', // ✅ String status
        stockActual: 75,
        stockMinimo: 15,
        categoria: 'LIQUIDOS',
        costoUnitario: 89.99
      };

      // Act
      const result = adaptToKyselyMateriaPrisma(unifiedMock);

      // Assert
      expect(result).toEqual<Partial<MateriaPrima>>({
        nombre: 'Para Kysely',
        codigoBarras: '1111111111111',
        presentacion: 'LITRO',
        activo: false, // ✅ Converts 'INACTIVO' to false
        stockActual: '75', // ✅ Converts number to string
        stockMinimo: '15',
        categoria: 'LIQUIDOS',
        costoUnitario: '89.99' // ✅ Converts number to string
      });
    });

    it('should handle boolean activo conversion', () => {
      // Arrange: Mock with activo boolean
      const unifiedMock: Partial<MateriaPrimaUnificada> = {
        nombre: 'Boolean Test',
        activo: true // ✅ Boolean status
      };

      // Act
      const result = adaptToKyselyMateriaPrisma(unifiedMock);

      // Assert
      expect(result.activo).toBe(true);
    });
  });

  describe('validateMateriaPrismaConsistency', () => {
    it('should validate consistent data', () => {
      // Arrange: Valid data
      const validData: MateriaPrimaUnificada = {
        id: 'valid-uuid',
        nombre: 'Valid Material',
        codigoBarras: '1234567890123',
        presentacion: 'UNIDAD',
        estatus: 'ACTIVO',
        activo: true, // ✅ Consistent with estatus
        stockActual: 100,
        stockMinimo: 20
      };

      // Act
      const result = validateMateriaPrismaConsistency(validData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect inconsistent estatus/activo', () => {
      // Arrange: Inconsistent data
      const inconsistentData: MateriaPrimaUnificada = {
        id: 'inconsistent-uuid',
        nombre: 'Inconsistent Material',
        codigoBarras: '1234567890123',
        presentacion: 'UNIDAD',
        estatus: 'ACTIVO',
        activo: false // ❌ Inconsistent with estatus
      };

      // Act
      const result = validateMateriaPrismaConsistency(inconsistentData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Inconsistencia: activo=false pero estatus=ACTIVO. Se esperaba estatus=INACTIVO'
      );
    });

    it('should validate stock constraints', () => {
      // Arrange: Invalid stock
      const invalidStockData: MateriaPrimaUnificada = {
        id: 'invalid-stock-uuid',
        nombre: 'Invalid Stock',
        codigoBarras: '1234567890123',
        presentacion: 'UNIDAD',
        estatus: 'ACTIVO',
        stockActual: -10, // ❌ Negative stock
        stockMinimo: NaN // ❌ NaN
      };

      // Act
      const result = validateMateriaPrismaConsistency(invalidStockData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('stockActual debe ser un número mayor o igual a 0');
      expect(result.errors).toContain('stockMinimo debe ser un número mayor o igual a 0');
    });

    it('should validate required fields', () => {
      // Arrange: Missing required fields
      const incompleteData: MateriaPrimaUnificada = {
        id: 'incomplete-uuid',
        nombre: 'Incomplete Data',
        presentacion: 'UNIDAD',
        estatus: 'ACTIVO',
        stockActual: 100,
        stockMinimo: 20,
        codigoBarras: '' // ❌ Empty barcode
      };

      // Act
      const result = validateMateriaPrismaConsistency(incompleteData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('codigoBarras es requerido');
    });
  });
});