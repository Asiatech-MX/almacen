/**
 * Tests para Proveedores adapters
 * Tests-First Implementation - Phase 2.2
 */

import {
  ProveedorUnificado,
  adaptKyselyProveedor,
  adaptToKyselyProveedor,
  validateProveedorConsistency
} from '../../backend/types/adapters/proveedores.adapter';

import type { Proveedor } from '../../backend/types/generated/database.types';

describe('Proveedores Adapters', () => {

  describe('adaptKyselyProveedor', () => {
    it('should convert Kysely Proveedor to unified interface', () => {
      // Arrange: Mock Kysely data
      const kyselyMock: Proveedor = {
        id: 123,
        nombre: 'Proveedor de Prueba SA de CV',
        idFiscal: 'PROV123456ABC',
        rfc: 'PROV123456ABC',
        curp: 'PROV123456HDFRNN09',
        estatus: 'ACTIVO',
        contacto: 'Juan Pérez',
        domicilio: 'Calle Principal #123',
        telefono: '5551234567',
        email: 'contacto@proveedor.com',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-15')
      };

      // Act
      const result = adaptKyselyProveedor(kyselyMock);

      // Assert
      expect(result).toEqual<ProveedorUnificado>({
        id: 123,
        nombre: 'Proveedor de Prueba SA de CV',
        idFiscal: 'PROV123456ABC',
        rfc: 'PROV123456ABC',
        curp: 'PROV123456HDFRNN09',
        estatus: 'ACTIVO', // ✅ Preserves string status
        activo: true, // ✅ Converts 'ACTIVO' to true
        contacto: 'Juan Pérez',
        domicilio: 'Calle Principal #123',
        telefono: '5551234567',
        email: 'contacto@proveedor.com',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-15')
      });
    });

    it('should handle INACTIVO status correctly', () => {
      // Arrange: Mock with INACTIVO status
      const kyselyMock: Proveedor = {
        id: 456,
        nombre: 'Proveedor Inactivo',
        idFiscal: 'INACT789XYZ',
        estatus: 'INACTIVO',
        contacto: null,
        domicilio: null,
        telefono: null,
        email: null,
        idInstitucion: 2,
        fechaRegistro: new Date('2024-12-01')
      };

      // Act
      const result = adaptKyselyProveedor(kyselyMock);

      // Assert
      expect(result.estatus).toBe('INACTIVO');
      expect(result.activo).toBe(false); // ✅ Converts 'INACTIVO' to false
      expect(result.contacto).toBeNull();
      expect(result.domicilio).toBeNull();
    });

    it('should handle SUSPENDIDO status correctly', () => {
      // Arrange: Mock with SUSPENDIDO status
      const kyselyMock: Proveedor = {
        id: 789,
        nombre: 'Proveedor Suspendido',
        idFiscal: 'SUSP123XYZ',
        estatus: 'SUSPENDIDO',
        contacto: null,
        domicilio: null,
        telefono: null,
        email: null,
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = adaptKyselyProveedor(kyselyMock);

      // Assert
      expect(result.estatus).toBe('SUSPENDIDO');
      expect(result.activo).toBe(false); // ✅ 'SUSPENDIDO' converts to false
    });
  });

  describe('adaptToKyselyProveedor', () => {
    it('should convert unified interface to Kysely format', () => {
      // Arrange: Mock unified data
      const unifiedMock: Partial<ProveedorUnificado> = {
        nombre: 'Para Kysely',
        idFiscal: 'KYS123456',
        rfc: 'KYS123456ABC',
        estatus: 'INACTIVO', // ✅ String status
        contacto: 'Contacto Test',
        domicilio: 'Domicilio Test',
        telefono: '5559876543',
        email: 'test@kysely.com',
        idInstitucion: 3
      };

      // Act
      const result = adaptToKyselyProveedor(unifiedMock);

      // Assert
      expect(result).toEqual<Partial<Proveedor>>({
        nombre: 'Para Kysely',
        idFiscal: 'KYS123456',
        rfc: 'KYS123456ABC',
        estatus: 'INACTIVO', // ✅ Preserves string status
        contacto: 'Contacto Test',
        domicilio: 'Domicilio Test',
        telefono: '5559876543',
        email: 'test@kysely.com',
        idInstitucion: 3
      });
    });

    it('should handle boolean activo conversion', () => {
      // Arrange: Mock with activo boolean
      const unifiedMock: Partial<ProveedorUnificado> = {
        nombre: 'Boolean Test',
        idFiscal: 'BOOL123456',
        activo: true // ✅ Boolean status
      };

      // Act
      const result = adaptToKyselyProveedor(unifiedMock);

      // Assert
      expect(result.estatus).toBe('ACTIVO'); // ✅ Converts true to 'ACTIVO'
    });

    it('should prioritize estatus over activo when both provided', () => {
      // Arrange: Mock with both estatus and activo
      const unifiedMock: Partial<ProveedorUnificado> = {
        nombre: 'Priority Test',
        idFiscal: 'PRI123456',
        estatus: 'INACTIVO', // ✅ Should take priority
        activo: true // ❌ Should be ignored
      };

      // Act
      const result = adaptToKyselyProveedor(unifiedMock);

      // Assert
      expect(result.estatus).toBe('INACTIVO'); // ✅ estatus has priority
    });
  });

  describe('validateProveedorConsistency', () => {
    it('should validate consistent data', () => {
      // Arrange: Valid data
      const validData: ProveedorUnificado = {
        id: 1,
        nombre: 'Proveedor Válido',
        idFiscal: 'VALID123456',
        estatus: 'ACTIVO',
        activo: true, // ✅ Consistent with estatus
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(validData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect inconsistent estatus/activo', () => {
      // Arrange: Inconsistent data
      const inconsistentData: ProveedorUnificado = {
        id: 2,
        nombre: 'Proveedor Inconsistente',
        idFiscal: 'INCON123456',
        estatus: 'INACTIVO',
        activo: true, // ❌ Inconsistent with estatus
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(inconsistentData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Inconsistencia: activo=true pero estatus=INACTIVO. Se esperaba estatus=ACTIVO'
      );
    });

    it('should validate required fields', () => {
      // Arrange: Missing required fields
      const incompleteData: ProveedorUnificado = {
        id: 3,
        nombre: '', // ❌ Empty name
        idFiscal: '', // ❌ Empty fiscal ID
        estatus: 'ACTIVO',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(incompleteData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nombre es requerido');
      expect(result.errors).toContain('idFiscal es requerido');
    });

    it('should validate RFC format', () => {
      // Arrange: Invalid RFC
      const invalidRfcData: ProveedorUnificado = {
        id: 4,
        nombre: 'Proveedor con RFC Inválido',
        idFiscal: 'RFC123456',
        rfc: 'INVALID_FORMAT', // ❌ Invalid RFC format
        estatus: 'ACTIVO',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(invalidRfcData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('RFC no tiene formato válido');
    });

    it('should validate CURP format', () => {
      // Arrange: Invalid CURP
      const invalidCurpData: ProveedorUnificado = {
        id: 5,
        nombre: 'Proveedor con CURP Inválido',
        idFiscal: 'CURP123456',
        curp: 'INVALID_CURP_FORMAT', // ❌ Invalid CURP format
        estatus: 'ACTIVO',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(invalidCurpData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CURP no tiene formato válido');
    });

    it('should validate email format', () => {
      // Arrange: Invalid email
      const invalidEmailData: ProveedorUnificado = {
        id: 6,
        nombre: 'Proveedor con Email Inválido',
        idFiscal: 'EMAIL123456',
        email: 'invalid-email-format', // ❌ Invalid email format
        estatus: 'ACTIVO',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(invalidEmailData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email no tiene formato válido');
    });

    it('should handle null optional fields', () => {
      // Arrange: Valid data with null optional fields
      const validNullData: ProveedorUnificado = {
        id: 7,
        nombre: 'Proveedor con Campos Nulos',
        idFiscal: 'NULL123456',
        rfc: null,
        curp: null,
        contacto: null,
        domicilio: null,
        telefono: null,
        email: null,
        estatus: 'ACTIVO',
        idInstitucion: 1,
        fechaRegistro: new Date('2025-01-01')
      };

      // Act
      const result = validateProveedorConsistency(validNullData);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});