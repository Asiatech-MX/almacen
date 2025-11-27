/**
 * Unit Tests for useMateriaPrima Hook - Phase 5 Implementation
 * Testing the exclusion of INACTIVE materials from React hooks
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMateriaPrima } from '../../src/hooks/useMateriaPrima';
import type { MateriaPrima } from '../../../shared/types/materiaPrima';

// Mock del servicio
jest.mock('../../src/services/materiaPrimaService', () => ({
  materiaPrimaService: {
    listar: jest.fn(),
    listarSoloActivos: jest.fn(),
    listarInactivos: jest.fn(),
    listarTodos: jest.fn()
  }
}));

jest.mock('../../src/services/enhancedMateriaPrimaService', () => ({
  enhancedMateriaPrimaService: {
    getEstadisticas: jest.fn(),
    clearAllCache: jest.fn()
  }
}));

import { materiaPrimaService } from '../../src/services/materiaPrimaService';
import { enhancedMateriaPrimaService } from '../../src/services/enhancedMateriaPrimaService';

const mockMateriaPrimaService = materiaPrimaService as jest.Mocked<typeof materiaPrimaService>;
const mockEnhancedService = enhancedMateriaPrimaService as jest.Mocked<typeof enhancedMateriaPrimaService>;

describe('useMateriaPrima Hook - Phase 5 Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnhancedService.clearAllCache();
  });

  describe('✅ 5.3.1 Hook - Exclusión INACTIVO en estadísticas', () => {
    it('should calculate statistics excluding INACTIVE materials', async () => {
      // Arrange: Mock data con mezcla de estados
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true, stock_actual: 100, stock_minimo: 50, costo_unitario: 10 },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false, stock_actual: 200, stock_minimo: 100, costo_unitario: 50 },
        { id: '3', nombre: 'Activo 2', estatus: 'ACTIVO', activo: true, stock_actual: 25, stock_minimo: 30, costo_unitario: 20 },
        { id: '4', nombre: 'Inactivo 2', estatus: 'INACTIVO', activo: false, stock_actual: 0, stock_minimo: 10, costo_unitario: 15 }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue([mockData[0], mockData[2]]);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([mockData[1], mockData[3]]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 2, // Solo ACTIVOS
        bajoStock: 1, // Activo 2 con stock bajo
        sinStock: 0,
        valorTotal: (100 * 10) + (25 * 20) // Solo ACTIVOS
      });

      // Act: Render hook
      const { result } = renderHook(() => useMateriaPrima());

      // Esperar carga inicial
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert: Estadísticas calculadas solo con ACTIVOS
      expect(result.current.estadisticas.total).toBe(2);
      expect(result.current.estadisticas.bajoStock).toBe(1);
      expect(result.current.estadisticas.sinStock).toBe(0);
      expect(result.current.estadisticas.valorTotal).toBe((100 * 10) + (25 * 20));

      // Verificar que todos los materiales estén disponibles
      expect(result.current.materiales).toHaveLength(4);

      // Verificar filtro implícito en estadísticas
      const activosEnHook = result.current.materiales.filter(m => m.estatus !== 'INACTIVO');
      const inactivosEnHook = result.current.materiales.filter(m => m.estatus === 'INACTIVO');

      expect(activosEnHook).toHaveLength(2);
      expect(inactivosEnHook).toHaveLength(2);
    });

    it('should update statistics when materials change', async () => {
      // Arrange: Estado inicial
      const initialData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true, stock_actual: 100, stock_minimo: 10, costo_unitario: 10 }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue(initialData);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 1,
        bajoStock: 0,
        sinStock: 0,
        valorTotal: 1000
      });

      const { result } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.estadisticas.total).toBe(1);

      // Act: Agregar nuevo material INACTIVO
      const updatedData: MateriaPrima[] = [
        ...initialData,
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false, stock_actual: 200, stock_minimo: 10, costo_unitario: 50 }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue(initialData);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([updatedData[1]]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 1, // Sigue siendo 1 (solo ACTIVOS)
        bajoStock: 0,
        sinStock: 0,
        valorTotal: 1000 // Sigue siendo el mismo
      });

      // Trigger recarga
      await act(async () => {
        await result.current.recargar();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert: Estadísticas no deben cambiar por materiales INACTIVOS
      expect(result.current.estadisticas.total).toBe(1);
      expect(result.current.materiales).toHaveLength(2);
    });
  });

  describe('✅ 5.3.2 Hook - Métodos especializados', () => {
    it('should provide separate methods for ACTIVE and INACTIVE materials', async () => {
      // Arrange: Data separada
      const activeData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true }
      ];
      const inactiveData: MateriaPrima[] = [
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue(activeData);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue(inactiveData);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 1,
        bajoStock: 0,
        sinStock: 0,
        valorTotal: 0
      });

      const { result } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act: Usar métodos especializados
      let activos: MateriaPrima[] = [];
      let inactivos: MateriaPrima[] = [];

      await act(async () => {
        activos = await result.current.obtenerActivos();
        inactivos = await result.current.obtenerInactivos();
      });

      // Assert: Métodos devuelven datos correctos
      expect(mockMateriaPrimaService.listarSoloActivos).toHaveBeenCalled();
      expect(mockMateriaPrimaService.listarInactivos).toHaveBeenCalled();

      expect(activos).toEqual(activeData);
      expect(inactivos).toEqual(inactiveData);
    });

    it('should handle mixed materials correctly in UI methods', async () => {
      // Arrange: Dataset completo
      const allData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true, stock_actual: 100, stock_minimo: 10 },
        { id: '2', nombre: 'Inactivo 1', estatus: 'INACTIVO', activo: false, stock_actual: 5, stock_minimo: 10 },
        { id: '3', nombre: 'Activo 2', estatus: 'ACTIVO', activo: true, stock_actual: 0, stock_minimo: 10 }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue([allData[0], allData[2]]);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([allData[1]]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 2,
        bajoStock: 1,
        sinStock: 1,
        valorTotal: 1000
      });

      const { result } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Act: Métodos de UI que filtran por estado
      const materialesBajoStock = result.current.obtenerMaterialesBajoStock();
      const materialesSinStock = result.current.obtenerMaterialesSinStock();

      // Assert: Solo deben incluir materiales ACTIVOS
      expect(materialesBajoStock).toHaveLength(1); // Activo 2 (0 <= 10)
      expect(materialesSinStock).toHaveLength(1); // Activo 2 (stock = 0)

      materialesBajoStock.forEach(material => {
        expect(material.estatus).toBe('ACTIVO');
        expect(material.activo).toBe(true);
      });

      materialesSinStock.forEach(material => {
        expect(material.estatus).toBe('ACTIVO');
        expect(material.activo).toBe(true);
      });
    });
  });

  describe('🧪 5.3.3 Hook - Error handling', () => {
    it('should handle loading states correctly', async () => {
      // Arrange: API lenta
      mockMateriaPrimaService.listarSoloActivos.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 0,
        bajoStock: 0,
        sinStock: 0,
        valorTotal: 0
      });

      const { result } = renderHook(() => useMateriaPrima());

      // Assert: Estado inicial
      expect(result.current.loading).toBe(true);
      expect(result.current.materiales).toHaveLength(0);
      expect(result.current.error).toBeNull();

      // Esperar carga
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange: Error en servicio
      mockMateriaPrimaService.listarSoloActivos.mockRejectedValue(new Error('Service Error'));
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([]);

      const { result } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert: Error manejado
      expect(result.current.error).toBeTruthy();
      expect(result.current.materiales).toHaveLength(0);
      expect(result.current.estadisticas.total).toBe(0);
    });

    it('should handle partial failures', async () => {
      // Arrange: Un servicio falla, el otro funciona
      mockMateriaPrimaService.listarSoloActivos.mockRejectedValue(new Error('Active Error'));
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([
        { id: '1', nombre: 'Inactivo', estatus: 'INACTIVO', activo: false }
      ]);

      const { result } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert: Debe manejar error pero continuar con datos disponibles
      expect(result.current.error).toBeTruthy();
      expect(result.current.materiales).toHaveLength(1); // Solo inactivos cargados
    });
  });

  describe('✅ 5.3.4 Hook - Performance y optimización', () => {
    it('should not recalculate statistics unnecessarily', async () => {
      // Arrange: Spy en enhanced service
      const statsSpy = jest.spyOn(mockEnhancedService, 'getEstadisticas');

      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue(mockData);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 1,
        bajoStock: 0,
        sinStock: 0,
        valorTotal: 0
      });

      const { result, rerender } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = statsSpy.mock.calls.length;

      // Act: Re-render sin cambios
      rerender();

      // Assert: No debe recalcular estadísticas
      await waitFor(() => {
        expect(statsSpy).toHaveBeenCalledTimes(initialCallCount);
      });

      statsSpy.mockRestore();
    });

    it('should cache materials between hook calls', async () => {
      // Arrange: Mock data
      const mockData: MateriaPrima[] = [
        { id: '1', nombre: 'Activo 1', estatus: 'ACTIVO', activo: true }
      ];

      mockMateriaPrimaService.listarSoloActivos.mockResolvedValue(mockData);
      mockMateriaPrimaService.listarInactivos.mockResolvedValue([]);
      mockEnhancedService.getEstadisticas.mockResolvedValue({
        total: 1,
        bajoStock: 0,
        sinStock: 0,
        valorTotal: 0
      });

      const { result } = renderHook(() => useMateriaPrima());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockMateriaPrimaService.listarSoloActivos.mock.calls.length;

      // Act: Llamadas múltiples al mismo método
      await act(async () => {
        await result.current.obtenerActivos();
        await result.current.obtenerActivos();
        await result.current.obtenerActivos();
      });

      // Assert: Debe usar caché
      expect(mockMateriaPrimaService.listarSoloActivos).toHaveBeenCalledTimes(initialCallCount);
    });
  });
});