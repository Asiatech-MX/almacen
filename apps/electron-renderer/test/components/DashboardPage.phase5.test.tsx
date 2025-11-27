/**
 * Unit Tests for DashboardPage Component - Phase 5 Implementation
 * Testing the exclusion of INACTIVE materials from dashboard statistics
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardPage } from '../../src/modules/dashboard/DashboardPage';
import type { MateriaPrima } from '../../../../shared/types/materiaPrima';

// Mock de hooks y servicios
jest.mock('../../src/hooks/useMateriaPrima', () => ({
  useMateriaPrima: jest.fn()
}));

jest.mock('../../src/hooks/useMovimientos', () => ({
  useMovimientos: jest.fn(() => ({
    movimientos: [],
    loading: false,
    error: null,
    recargar: jest.fn()
  }))
}));

import { useMateriaPrima } from '../../src/hooks/useMateriaPrima';
const mockUseMateriaPrima = useMateriaPrima as jest.MockedFunction<typeof useMateriaPrima>;

describe('DashboardPage Component - Phase 5 Testing', () => {
  const createMockMaterials = (activos: number, inactivos: number): MateriaPrima[] => {
    const materials: MateriaPrima[] = [];

    // Materiales ACTIVOS
    for (let i = 1; i <= activos; i++) {
      materials.push({
        id: `activo-${i}`,
        nombre: `Material Activo ${i}`,
        estatus: 'ACTIVO',
        activo: true,
        stock_actual: i * 10,
        stock_minimo: 15,
        costo_unitario: 100 + i * 10
      });
    }

    // Materiales INACTIVOS
    for (let i = 1; i <= inactivos; i++) {
      materials.push({
        id: `inactivo-${i}`,
        nombre: `Material Inactivo ${i}`,
        estatus: 'INACTIVO',
        activo: false,
        stock_actual: i * 50,
        stock_minimo: 25,
        costo_unitario: 200 + i * 20
      });
    }

    return materials;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ 5.4.1 Dashboard - Exclusión INACTIVO en métricas', () => {
    it('should display statistics excluding INACTIVE materials', async () => {
      // Arrange: 3 ACTIVOS, 2 INACTIVOS
      const mockMaterials = createMockMaterials(3, 2);

      mockUseMateriaPrima.mockReturnValue({
        materiales: mockMaterials,
        loading: false,
        error: null,
        estadisticas: {
          total: 3, // Solo ACTIVOS
          bajoStock: 2, // 2 ACTIVOS con stock bajo (10 y 20 <= 15)
          sinStock: 0,
          valorTotal: (10 * 110) + (20 * 120) + (30 * 130) // Solo ACTIVOS: 1100 + 2400 + 3900
        },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve(mockMaterials.filter(m => m.activo))),
        obtenerInactivos: jest.fn(() => Promise.resolve(mockMaterials.filter(m => !m.activo))),
        obtenerMaterialesBajoStock: jest.fn(() => mockMaterials.filter(m => m.activo && m.stock_actual <= m.stock_minimo)),
        obtenerMaterialesSinStock: jest.fn(() => mockMaterials.filter(m => m.activo && m.stock_actual === 0))
      });

      // Act: Render component
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
      });

      // Assert: Métricas excluyen INACTIVOS
      expect(screen.getByText('3')).toBeInTheDocument(); // Total de materiales
      expect(screen.getByText('2')).toBeInTheDocument(); // Materiales bajo stock
      expect(screen.getByText('7400')).toBeInTheDocument(); // Valor total sin INACTIVOS

      // No debe mostrar estadísticas de INACTIVOS
      expect(screen.queryByText('5')).not.toBeInTheDocument(); // No debe mostrar total 5
      expect(screen.queryByText(/18400/)).not.toBeInTheDocument(); // No debe mostrar valor total con INACTIVOS
    });

    it('should handle only ACTIVE materials correctly', async () => {
      // Arrange: Solo materiales ACTIVOS
      const mockMaterials = createMockMaterials(4, 0);

      mockUseMateriaPrima.mockReturnValue({
        materiales: mockMaterials,
        loading: false,
        error: null,
        estadisticas: {
          total: 4,
          bajoStock: 3,
          sinStock: 0,
          valorTotal: 10000
        },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve(mockMaterials)),
        obtenerInactivos: jest.fn(() => Promise.resolve([])),
        obtenerMaterialesBajoStock: jest.fn(() => mockMaterials.filter(m => m.stock_actual <= m.stock_minimo)),
        obtenerMaterialesSinStock: jest.fn(() => mockMaterials.filter(m => m.stock_actual === 0))
      });

      // Act
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
      });

      // Assert: Todas las métricas son de ACTIVOS
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10000')).toBeInTheDocument();
    });

    it('should handle only INACTIVE materials correctly', async () => {
      // Arrange: Solo materiales INACTIVOS
      const mockMaterials = createMockMaterials(0, 3);

      mockUseMateriaPrima.mockReturnValue({
        materiales: mockMaterials,
        loading: false,
        error: null,
        estadisticas: {
          total: 0, // No hay ACTIVOS
          bajoStock: 0,
          sinStock: 0,
          valorTotal: 0
        },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve([])),
        obtenerInactivos: jest.fn(() => Promise.resolve(mockMaterials)),
        obtenerMaterialesBajoStock: jest.fn(() => []),
        obtenerMaterialesSinStock: jest.fn(() => [])
      });

      // Act
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
      });

      // Assert: Estadísticas en cero
      expect(screen.getByText('0')).toBeInTheDocument(); // Total materiales
      expect(screen.getByText('0')).toBeInTheDocument(); // Bajo stock
      expect(screen.getByText('0')).toBeInTheDocument(); // Valor total
    });
  });

  describe('✅ 5.4.2 Dashboard - Loading y Error states', () => {
    it('should show loading state', () => {
      // Arrange: Loading state
      mockUseMateriaPrima.mockReturnValue({
        materiales: [],
        loading: true,
        error: null,
        estadisticas: { total: 0, bajoStock: 0, sinStock: 0, valorTotal: 0 },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve([])),
        obtenerInactivos: jest.fn(() => Promise.resolve([])),
        obtenerMaterialesBajoStock: jest.fn(() => []),
        obtenerMaterialesSinStock: jest.fn(() => [])
      });

      // Act
      render(<DashboardPage />);

      // Assert: Mostrar loading
      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      // Arrange: Error state
      mockUseMateriaPrima.mockReturnValue({
        materiales: [],
        loading: false,
        error: 'Error al cargar materiales',
        estadisticas: { total: 0, bajoStock: 0, sinStock: 0, valorTotal: 0 },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve([])),
        obtenerInactivos: jest.fn(() => Promise.resolve([])),
        obtenerMaterialesBajoStock: jest.fn(() => []),
        obtenerMaterialesSinStock: jest.fn(() => [])
      });

      // Act
      render(<DashboardPage />);

      // Assert: Mostrar error
      expect(screen.getByText(/Error al cargar materiales/i)).toBeInTheDocument();
    });
  });

  describe('🧪 5.4.3 Dashboard - Edge cases', () => {
    it('should handle empty data gracefully', async () => {
      // Arrange: No hay materiales
      mockUseMateriaPrima.mockReturnValue({
        materiales: [],
        loading: false,
        error: null,
        estadisticas: { total: 0, bajoStock: 0, sinStock: 0, valorTotal: 0 },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve([])),
        obtenerInactivos: jest.fn(() => Promise.resolve([])),
        obtenerMaterialesBajoStock: jest.fn(() => []),
        obtenerMaterialesSinStock: jest.fn(() => [])
      });

      // Act
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
      });

      // Assert: Mostrar ceros sin errores
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should format large numbers correctly', async () => {
      // Arrange: Valores grandes
      const mockMaterials = createMockMaterials(2, 0);
      mockMaterials[0].costo_unitario = 1000000;
      mockMaterials[1].costo_unitario = 2000000;

      mockUseMateriaPrima.mockReturnValue({
        materiales: mockMaterials,
        loading: false,
        error: null,
        estadisticas: {
          total: 2,
          bajoStock: 1,
          sinStock: 0,
          valorTotal: 30000000 // 30 millones
        },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve(mockMaterials)),
        obtenerInactivos: jest.fn(() => Promise.resolve([])),
        obtenerMaterialesBajoStock: jest.fn(() => [mockMaterials[0]]),
        obtenerMaterialesSinStock: jest.fn(() => [])
      });

      // Act
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
      });

      // Assert: Formato correcto (puede variar según implementación)
      expect(screen.getByText('2')).toBeInTheDocument();
      // El valor formateado debe aparecer (formato específico depende de la implementación)
      expect(screen.getByText(/\$?30,000,000/)).toBeInTheDocument();
    });

    it('should handle materials with undefined/null costs', async () => {
      // Arrange: Materiales sin costo definido
      const mockMaterials: MateriaPrima[] = [
        {
          id: '1',
          nombre: 'Material sin costo',
          estatus: 'ACTIVO',
          activo: true,
          stock_actual: 10,
          stock_minimo: 5,
          costo_unitario: undefined // Sin costo
        }
      ];

      mockUseMateriaPrima.mockReturnValue({
        materiales: mockMaterials,
        loading: false,
        error: null,
        estadisticas: {
          total: 1,
          bajoStock: 0,
          sinStock: 0,
          valorTotal: 0 // Costo undefined = 0 en cálculo
        },
        recargar: jest.fn(),
        obtenerActivos: jest.fn(() => Promise.resolve(mockMaterials)),
        obtenerInactivos: jest.fn(() => Promise.resolve([])),
        obtenerMaterialesBajoStock: jest.fn(() => []),
        obtenerMaterialesSinStock: jest.fn(() => [])
      });

      // Act
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
      });

      // Assert: Manejar costo undefined
      expect(screen.getByText('1')).toBeInTheDocument(); // Total materiales
      expect(screen.getByText('0')).toBeInTheDocument(); // Valor total
    });
  });
});