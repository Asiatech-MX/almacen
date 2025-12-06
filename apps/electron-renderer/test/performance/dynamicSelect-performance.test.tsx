/**
 * Performance Tests for DynamicSelect Component
 *
 * Tests focused on:
 * - Large dataset handling (1000+ items)
 * - Memory usage optimization
 * - Render performance
 * - Search/filter performance
 * - Caching efficiency
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { QueryClient } from '@tanstack/react-query';
import { mockElectronAPI, createTestQueryClient, createTestWrapper } from '../../src/hooks/__tests__/setup.test';
import { MemoizedDynamicSelect } from '../../src/components/ui/DynamicSelect';

// Mock de componentes externos
jest.mock('react-select', () => {
  const MockSelect = ({ options, value, onChange, isDisabled, isLoading, placeholder }: any) => {
    // Medir rendimiento de renderizado
    const renderStart = performance.now();

    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const handleSelect = (selectedValue: string) => {
      const selectStart = performance.now();
      const selectedOption = options.find((opt: any) => opt.value === selectedValue);
      onChange(selectedOption || null);
      setIsOpen(false);
      const selectEnd = performance.now();
      console.log(`Selection time: ${selectEnd - selectStart}ms`);
    };

    // Filtrar opciones basadas en búsqueda
    const filteredOptions = React.useMemo(() => {
      const filterStart = performance.now();
      const filtered = options?.filter((option: any) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];
      const filterEnd = performance.now();
      console.log(`Filter ${options?.length || 0} items -> ${filtered.length}: ${filterEnd - filterStart}ms`);
      return filtered;
    }, [options, searchTerm]);

    const renderEnd = performance.now();
    console.log(`Render time: ${renderEnd - renderStart}ms`);

    return (
      <div data-testid="react-select-performance" data-options-count={options?.length || 0}>
        <div
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          data-testid="select-trigger"
          className="select-trigger"
        >
          {value?.label || placeholder}
          <span data-testid="dropdown-arrow">▼</span>
          {isLoading && <span data-testid="loading-indicator">Loading...</span>}
        </div>

        {isOpen && !isDisabled && (
          <div data-testid="dropdown-menu">
            {/* Input de búsqueda */}
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-input"
              className="search-input"
            />

            <div data-testid="dropdown-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredOptions.slice(0, 100).map((option: any) => (
                <div
                  key={option.value}
                  data-testid={`option-${option.value}`}
                  className="dropdown-option"
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))}
              {filteredOptions.length > 100 && (
                <div data-testid="more-options">... y {filteredOptions.length - 100} más</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  return MockSelect;
});

// Mock de dependencias
jest.mock('../../src/lib/performanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    measureRender: jest.fn(),
    measureInteraction: jest.fn(),
    measureAsync: jest.fn(),
    recordMetric: jest.fn()
  })
}));

jest.mock('../../src/hooks/useResponsiveSelect', () => ({
  useResponsiveSelect: () => ({
    isMobile: false,
    getSelectProps: () => ({})
  })
}));

jest.mock('../../src/hooks/useReferenceDataQuery', () => ({
  useEditarCategoriaMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true })
  }),
  useEditarPresentacionMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true })
  })
}));

describe('DynamicSelect Performance Tests', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => createTestWrapper(queryClient)({ children });
    user = userEvent.setup();

    // Mockear console.log para capturar mediciones de rendimiento
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createLargeDataset = (size: number, type: 'categoria' | 'presentacion') => {
    const base = type === 'categoria' ?
      { nombre: 'Categoría', descripcion: 'Descripción de categoría' } :
      { nombre: 'Presentación', descripcion: 'Descripción de presentación', abreviatura: 'P' };

    return Array.from({ length: size }, (_, i) => ({
      ...base,
      id: (i + 1).toString(),
      nombre: `${base.nombre} ${i + 1}`,
      descripcion: `${base.descripcion} ${i + 1}`,
      ...(type === 'presentacion' && { abreviatura: `P${i + 1}` })
    }));
  };

  const createTestComponent = (datasetSize: number, type: 'categoria' | 'presentacion') => {
    const largeDataset = createLargeDataset(datasetSize, type);

    mockElectronAPI.categoria.listar.mockResolvedValue(
      type === 'categoria' ? largeDataset : []
    );
    mockElectronAPI.presentacion.listar.mockResolvedValue(
      type === 'presentacion' ? largeDataset : []
    );

    const TestComponent = () => {
      const { control, watch } = useForm({
        defaultValues: { [`${type}_id`]: null }
      });

      const currentValue = watch(`${type}_id`);

      return (
        <div>
          <div data-testid="current-value">Valor: {currentValue || 'Ninguno'}</div>
          <div data-testid="dataset-size">Dataset: {datasetSize} items</div>

          <MemoizedDynamicSelect
            control={control}
            name={`${type}_id`}
            label={type === 'categoria' ? 'Categoría' : 'Presentación'}
            type={type}
          />
        </div>
      );
    };

    return { TestComponent, largeDataset };
  };

  describe('Large Dataset Rendering', () => {
    test('should render 1000 items efficiently', async () => {
      const datasetSize = 1000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      const renderStartTime = performance.now();

      render(<TestComponent />, { wrapper });

      const renderEndTime = performance.now();
      const totalRenderTime = renderEndTime - renderStartTime;

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
        expect(screen.getByTestId('dataset-size')).toHaveTextContent(`Dataset: ${datasetSize} items`);
        expect(screen.getByTestId('react-select-performance')).toHaveAttribute('data-options-count', '1000');
      });

      // Performance assertion: should render in less than 300ms
      expect(totalRenderTime).toBeLessThan(300);

      console.log(`Render time for ${datasetSize} items: ${totalRenderTime}ms`);
    });

    test('should render 5000 items within acceptable limits', async () => {
      const datasetSize = 5000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      const renderStartTime = performance.now();

      render(<TestComponent />, { wrapper });

      const renderEndTime = performance.now();
      const totalRenderTime = renderEndTime - renderStartTime;

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
        expect(screen.getByTestId('react-select-performance')).toHaveAttribute('data-options-count', '5000');
      });

      // Performance assertion: should render in less than 1s for 5000 items
      expect(totalRenderTime).toBeLessThan(1000);

      console.log(`Render time for ${datasetSize} items: ${totalRenderTime}ms`);
    });

    test('should handle 10000 items with degraded but acceptable performance', async () => {
      const datasetSize = 10000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      const renderStartTime = performance.now();

      render(<TestComponent />, { wrapper });

      const renderEndTime = performance.now();
      const totalRenderTime = renderEndTime - renderStartTime;

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
        expect(screen.getByTestId('react-select-performance')).toHaveAttribute('data-options-count', '10000');
      });

      // Performance assertion: should render in less than 2s for 10000 items
      expect(totalRenderTime).toBeLessThan(2000);

      console.log(`Render time for ${datasetSize} items: ${totalRenderTime}ms`);
    });
  });

  describe('Search Performance', () => {
    test('should search 1000 items quickly', async () => {
      const datasetSize = 1000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      // Abrir dropdown
      const selectTrigger = screen.getByTestId('select-trigger');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      });

      // Realizar búsqueda específica
      const searchInput = screen.getByTestId('search-input');
      const searchStartTime = performance.now();

      await user.type(searchInput, '500');

      const searchEndTime = performance.now();
      const searchTime = searchEndTime - searchStartTime;

      await waitFor(() => {
        expect(screen.getByTestId('option-500')).toBeInTheDocument();
      });

      // Search should complete in under 50ms
      expect(searchTime).toBeLessThan(50);

      console.log(`Search time in ${datasetSize} items: ${searchTime}ms`);
    });

    test('should search 5000 items within acceptable limits', async () => {
      const datasetSize = 5000;
      const { TestComponent } = createTestComponent(datasetSize, 'presentacion');

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      const selectTrigger = screen.getByTestId('select-trigger');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      const searchStartTime = performance.now();

      await user.type(searchInput, 'Presentación 2500');

      const searchEndTime = performance.now();
      const searchTime = searchEndTime - searchStartTime;

      await waitFor(() => {
        expect(screen.getByTestId('option-2500')).toBeInTheDocument();
      });

      // Search should complete in under 100ms for large datasets
      expect(searchTime).toBeLessThan(100);

      console.log(`Search time in ${datasetSize} items: ${searchTime}ms`);
    });
  });

  describe('Selection Performance', () => {
    test('should select items quickly in large datasets', async () => {
      const datasetSize = 3000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      // Abrir dropdown
      const selectTrigger = screen.getByTestId('select-trigger');
      await user.click(selectTrigger);

      await waitFor(() => {
        expect(screen.getByTestId('option-1500')).toBeInTheDocument();
      });

      // Seleccionar un item específico
      const selectionStartTime = performance.now();

      await user.click(screen.getByTestId('option-1500'));

      const selectionEndTime = performance.now();
      const selectionTime = selectionEndTime - selectionStartTime;

      // Selection should be instant (<10ms)
      expect(selectionTime).toBeLessThan(10);

      await waitFor(() => {
        expect(screen.getByTestId('current-value')).toHaveTextContent('Valor: 1500');
      });

      console.log(`Selection time in ${datasetSize} items: ${selectionTime}ms`);
    });

    test('should handle rapid sequential selections', async () => {
      const datasetSize = 1000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      const rapidSelectionStartTime = performance.now();

      // Realizar selecciones rápidas
      for (let i = 1; i <= 5; i++) {
        const selectTrigger = screen.getByTestId('select-trigger');
        await user.click(selectTrigger);

        await waitFor(() => {
          expect(screen.getByTestId(`option-${i * 100}`)).toBeInTheDocument();
        });

        await user.click(screen.getByTestId(`option-${i * 100}`));

        await waitFor(() => {
          expect(screen.getByTestId('current-value')).toHaveTextContent(`Valor: ${i * 100}`);
        });
      }

      const rapidSelectionEndTime = performance.now();
      const totalTime = rapidSelectionEndTime - rapidSelectionStartTime;
      const avgSelectionTime = totalTime / 5;

      // Average selection time should be under 50ms
      expect(avgSelectionTime).toBeLessThan(50);

      console.log(`Rapid selection avg time: ${avgSelectionTime}ms for ${datasetSize} items`);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with large datasets', async () => {
      const datasetSize = 2000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      // Medir memoria inicial
      if (performance.memory) {
        const initialMemory = performance.memory.usedJSHeapSize;

        render(<TestComponent />, { wrapper });

        await waitFor(() => {
          expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
        });

        // Realizar varias operaciones
        const selectTrigger = screen.getByTestId('select-trigger');
        await user.click(selectTrigger);

        await waitFor(() => {
          expect(screen.getByTestId('search-input')).toBeInTheDocument();
        });

        // Buscar y seleccionar múltiples items
        const searchInput = screen.getByTestId('search-input');
        await user.type(searchInput, '1000');
        await user.click(screen.getByTestId('option-1000'));

        // Medir memoria después de operaciones
        const finalMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable (<10MB for 2000 items)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB for ${datasetSize} items`);
      }
    });

    test('should clean up listeners and references on unmount', async () => {
      const datasetSize = 1500;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      const { unmount } = render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      // Desmontar componente
      const unmountStartTime = performance.now();
      unmount();
      const unmountEndTime = performance.now();
      const unmountTime = unmountEndTime - unmountStartTime;

      // Unmount should be quick (<50ms)
      expect(unmountTime).toBeLessThan(50);

      console.log(`Unmount time: ${unmountTime}ms for ${datasetSize} items`);
    });
  });

  describe('Re-render Performance', () => {
    test('should not re-render unnecessarily with stable props', async () => {
      const datasetSize = 1000;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      const renderSpy = jest.fn();

      const TestComponentWithSpy = () => {
        renderSpy();
        return <TestComponent />;
      };

      const { rerender } = render(<TestComponentWithSpy />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      // Primer render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render con mismas props
      rerender(<TestComponentWithSpy />);

      // No debería haber re-render por memo
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle prop changes efficiently', async () => {
      const datasetSize = 500;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      const TestComponentWithProps = ({ disabled = false }: { disabled?: boolean }) => {
        const { control } = useForm({
          defaultValues: { categoria_id: null }
        });

        return (
          <MemoizedDynamicSelect
            control={control}
            name="categoria_id"
            label="Categoría"
            type="categoria"
            disabled={disabled}
          />
        );
      };

      const { rerender } = render(<TestComponentWithProps />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      const propChangeStartTime = performance.now();

      // Cambiar props
      rerender(<TestComponentWithProps disabled={true} />);

      const propChangeEndTime = performance.now();
      const propChangeTime = propChangeEndTime - propChangeStartTime;

      // Prop changes should be handled quickly (<100ms)
      expect(propChangeTime).toBeLessThan(100);

      console.log(`Prop change time: ${propChangeTime}ms for ${datasetSize} items`);
    });
  });

  describe('Caching Performance', () => {
    test('should benefit from query caching', async () => {
      const datasetSize = 800;
      const { TestComponent } = createTestComponent(datasetSize, 'categoria');

      // Primer render - debería cargar desde API
      const firstRenderStart = performance.now();

      render(<TestComponent />, { wrapper });

      const firstRenderEnd = performance.now();

      await waitFor(() => {
        expect(screen.getByTestId('react-select-performance')).toBeInTheDocument();
      });

      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledTimes(1);

      // Segundo render - debería usar caché
      const secondRenderStart = performance.now();

      const { rerender } = render(<TestComponent />, { wrapper });

      const secondRenderEnd = performance.now();

      // No debería llamar a la API nuevamente (usar caché)
      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledTimes(1);

      const firstRenderTime = firstRenderEnd - firstRenderStart;
      const secondRenderTime = secondRenderEnd - secondRenderStart;

      // Segundo render debería ser significativamente más rápido por caché
      expect(secondRenderTime).toBeLessThan(firstRenderTime * 0.5);

      console.log(`First render: ${firstRenderTime}ms, Cached render: ${secondRenderTime}ms`);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple concurrent selects', async () => {
      const datasetSize = 300;

      // Mock para categorías y presentaciones
      mockElectronAPI.categoria.listar.mockResolvedValue(createLargeDataset(datasetSize, 'categoria'));
      mockElectronAPI.presentacion.listar.mockResolvedValue(createLargeDataset(datasetSize, 'presentacion'));

      const TestComponent = () => {
        const { control } = useForm({
          defaultValues: { categoria_id: null, presentacion_id: null }
        });

        return (
          <div>
            <MemoizedDynamicSelect
              control={control}
              name="categoria_id"
              label="Categoría"
              type="categoria"
            />
            <MemoizedDynamicSelect
              control={control}
              name="presentacion_id"
              label="Presentación"
              type="presentacion"
            />
          </div>
        );
      };

      const concurrentStartTime = performance.now();

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(screen.getAllByTestId('react-select-performance')).toHaveLength(2);
      });

      const concurrentEndTime = performance.now();
      const concurrentTime = concurrentEndTime - concurrentStartTime;

      // Concurrent operations should still be efficient (<500ms for 2 components)
      expect(concurrentTime).toBeLessThan(500);

      console.log(`Concurrent render time: ${concurrentTime}ms for 2 components with ${datasetSize} items each`);
    });
  });
});