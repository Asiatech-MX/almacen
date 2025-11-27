/**
 * Unit Tests for materiaPrimaService - Phase 5 Implementation
 * Testing the exclusion of INACTIVE materials from frontend services
 */

import { materiaPrimaService } from '../../src/services/materiaPrimaService';
import { enhancedMateriaPrimaService } from '../../src/services/enhancedMateriaPrimaService';
import type { MateriaPrima } from '../../../shared/types/materiaPrima';

// Mock de electronAPI
const mockElectronAPI = {
  materiaPrima: {
    listar: jest.fn(),
    listarActivos: jest.fn(),
    listarInactivos: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    stockBajo: jest.fn(),
  }
};

// Mock global de window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

describe('materiaPrimaService - Phase 5 Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar caché entre tests
    enhancedMateriaPrimaService.clearAllCache();
  });

  describe('✅ 5.2.1 Services - Exclusión INACTIVO por defecto', () => {
    it('should exclude INACTIVE materials by default in listar()', async () => {
      // Arrange: Mock data con materiales ACTIVOS e INACTIVOS
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Activo 2', estatus: 'ACTIVO', activo: true },
        { id: '3', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false }
      ];

      // Mock del handler listarActivos (debe ser llamado por defecto)
      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(mockData.filter(m => m.activo));

      // Act: Llamada sin parámetros
      const result = await materiaPrimaService.listar();

      // Assert: Debe llamar a listarActivos y devolver solo ACTIVOS
      expect(mockElectronAPI.materiaPrima.listarActivos).toHaveBeenCalled();
      expect(mockElectronAPI.materiaPrima.listar).not.toHaveBeenCalled();

      expect(result).toHaveLength(2);
      result.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.estatus).toBe('ACTIVO');
      });
    });

    it('should include INACTIVE materials when explicitly requested', async () => {
      // Arrange: Mock data completo
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false }
      ];

      mockElectronAPI.materiaPrima.listar.mockResolvedValue(mockData);

      // Act: Llamada con includeInactive: true
      const result = await materiaPrimaService.listar(undefined, { includeInactive: true });

      // Assert: Debe llamar a listar normal y devolver todos
      expect(mockElectronAPI.materiaPrima.listar).toHaveBeenCalledWith(undefined, { includeInactive: true });
      expect(mockElectronAPI.materiaPrima.listarActivos).not.toHaveBeenCalled();

      expect(result).toHaveLength(2);
      const activeCount = result.filter(m => m.activo).length;
      const inactiveCount = result.filter(m => !m.activo).length;

      expect(activeCount).toBe(1);
      expect(inactiveCount).toBe(1);
    });
  });

  describe('✅ 5.2.2 Services - Métodos especializados', () => {
    it('should list only ACTIVE materials with listarSoloActivos()', async () => {
      // Arrange: Mock data completo
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false },
        { id: '3', nombre: 'Activo 2', estatus: 'ACTIVO', activo: true }
      ];

      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(mockData.filter(m => m.activo));

      // Act
      const result = await materiaPrimaService.listarSoloActivos();

      // Assert: Solo materiales ACTIVOS
      expect(result).toHaveLength(2);
      expect(mockElectronAPI.materiaPrima.listarActivos).toHaveBeenCalled();

      result.forEach(material => {
        expect(material.activo).toBe(true);
        expect(material.estatus).toBe('ACTIVO');
      });
    });

    it('should list only INACTIVE materials with listarInactivos()', async () => {
      // Arrange: Mock data completo
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false },
        { id: '3', nombre: 'Inactivo 2', estatus: 'INACTIVO', activo: false }
      ];

      mockElectronAPI.materiaPrima.listarInactivos.mockResolvedValue(mockData.filter(m => !m.activo));

      // Act
      const result = await materiaPrimaService.listarInactivos();

      // Assert: Solo materiales INACTIVOS
      expect(result).toHaveLength(2);
      expect(mockElectronAPI.materiaPrima.listarInactivos).toHaveBeenCalled();

      result.forEach(material => {
        expect(material.activo).toBe(false);
        expect(material.estatus).toBe('INACTIVO');
      });
    });
  });
});

describe('enhancedMateriaPrimaService - Phase 5 Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    enhancedMateriaPrimaService.clearAllCache();
  });

  describe('✅ 5.2.3 Enhanced Service - Estadísticas con ACTIVOS', () => {
    it('should calculate statistics using only ACTIVE materials', async () => {
      // Arrange: Mock data con mezcla de estados
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true, stock_actual: 100, stock_minimo: 50, costo_unitario: 10 },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false, stock_actual: 200, stock_minimo: 100, costo_unitario: 20 },
        { id: '3', nombre: 'Activo 2', estatus: 'ACTIVO', activo: true, stock_actual: 0, stock_minimo: 10, costo_unitario: 15 }
      ];

      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(mockData.filter(m => m.activo));

      // Act
      const stats = await enhancedMateriaPrimaService.getEstadisticas();

      // Assert: Cálculos solo con materiales ACTIVOS
      expect(mockElectronAPI.materiaPrima.listarActivos).toHaveBeenCalled();
      expect(stats.total).toBe(2); // Solo 2 activos
      expect(stats.sinStock).toBe(1); // 1 activo sin stock
      expect(stats.bajoStock).toBe(1); // 1 activo bajo stock (el mismo sin stock)

      // Valor total: (100 * 10) + (0 * 15) = 1000 (sin incluir el inactivo)
      expect(stats.valorTotal).toBe(1000);
    });

    it('should handle empty ACTIVE materials list', async () => {
      // Arrange: No hay materiales activos
      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue([]);

      // Act
      const stats = await enhancedMateriaPrimaService.getEstadisticas();

      // Assert: Estadísticas en cero
      expect(stats.total).toBe(0);
      expect(stats.sinStock).toBe(0);
      expect(stats.bajoStock).toBe(0);
      expect(stats.valorTotal).toBe(0);
    });
  });

  describe('✅ 5.2.4 Enhanced Service - Cache Management', () => {
    it('should maintain separate cache for ACTIVE vs ALL materials', async () => {
      // Arrange: Data para diferentes cachés
      const activeData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true }
      ];
      const allData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false }
      ];

      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(activeData);
      mockElectronAPI.materiaPrima.listar.mockResolvedValue(allData);

      // Act: Primera llamada para ACTIVOS
      const activeResult = await materiaPrimaService.listarSoloActivos();
      expect(mockElectronAPI.materiaPrima.listarActivos).toHaveBeenCalledTimes(1);

      // Act: Segunda llamada para ACTIVOS (debe usar caché)
      const activeResult2 = await materiaPrimaService.listarSoloActivos();
      expect(mockElectronAPI.materiaPrima.listarActivos).toHaveBeenCalledTimes(1); // No aumento

      // Act: Llamada para TODOS (debe llamar API)
      const allResult = await materiaPrimaService.listarTodos();
      expect(mockElectronAPI.materiaPrima.listar).toHaveBeenCalledTimes(1);

      // Assert: Resultados correctos
      expect(activeResult).toEqual(activeData);
      expect(activeResult2).toEqual(activeData);
      expect(allResult).toEqual(allData);
    });

    it('should invalidate contaminated cache', async () => {
      // Arrange: Caché con datos incorrectos
      const contaminatedData: MateriaPrima[] = [
        { id: '1', nombre: 'Contaminado', estatus: 'ACTIVO', activo: true },
        { id: '2', nombre: 'Inactivo en caché', estatus: 'INACTIVO', activo: false }
      ];

      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(contaminatedData);

      // Act: Cargar caché contaminado
      await materiaPrimaService.listarSoloActivos();

      // Invalidar caché
      enhancedMateriaPrimaService.invalidateContaminatedCache();

      // Nueva llamada limpia
      const cleanData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo limpio', estatus: 'ACTIVO', activo: true }
      ];
      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(cleanData);

      const result = await materiaPrimaService.listarSoloActivos();

      // Assert: Debe llamar a API nuevamente
      expect(mockElectronAPI.materiaPrima.listarActivos).toHaveBeenCalledTimes(2);
      expect(result).toEqual(cleanData);
    });
  });

  describe('🧪 5.2.5 Services - Error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Arrange: API error
      mockElectronAPI.materiaPrima.listarActivos.mockRejectedValue(new Error('API Error'));

      // Act & Assert: No debe lanzar error no manejado
      await expect(materiaPrimaService.listarSoloActivos()).rejects.toThrow('API Error');
    });

    it('should handle empty responses from API', async () => {
      // Arrange: API devuelve null/undefined
      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(null as any);

      // Act
      const result = await materiaPrimaService.listarSoloActivos();

      // Assert: Debe manejar respuesta vacía
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle malformed data', async () => {
      // Arrange: Data sin estatus/activo
      const malformedData = [
        { id: '1', nombre: 'Sin estatus' },
        { id: '2', nombre: 'Sin activo', estatus: 'ACTIVO' }
      ] as any;

      mockElectronAPI.materiaPrima.listarActivos.mockResolvedValue(malformedData);

      // Act: No debe lanzar error
      const result = await materiaPrimaService.listarSoloActivos();

      // Assert: Debe devolver data aunque esté malformada
      expect(result).toHaveLength(2);
    });
  });
});