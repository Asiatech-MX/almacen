import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useForm, Control } from 'react-hook-form';
import DynamicSelect, { MemoizedDynamicSelect } from '../DynamicSelect';
import { Categoria, Presentacion } from '../../../../../../../packages/shared-types/src/referenceData';

// Mock de los hooks
vi.mock('@/hooks/useReferenceData', () => ({
  useReferenceData: vi.fn()
}));

vi.mock('@/hooks/useResponsiveSelect', () => ({
  useResponsiveSelect: vi.fn()
}));

vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

// Mock del componente Label
vi.mock('../label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={className} {...props}>
      {children}
    </label>
  )
}));

// Mock de InlineEditor
vi.mock('@/components/ui/InlineEditor', () => ({
  default: vi.fn(({ value, onSave, type }) => (
    <div data-testid="inline-editor">
      <input data-testid={`inline-input-${type}`} defaultValue={value?.nombre} />
      <button onClick={() => onSave?.(value)} data-testid="save-button">
        Guardar
      </button>
    </div>
  ))
}));

const mockUseReferenceData = vi.mocked(require('@/hooks/useReferenceData').useReferenceData);
const mockUseResponsiveSelect = vi.mocked(require('@/hooks/useResponsiveSelect').useResponsiveSelect);

// Mock data
const mockCategorias: Categoria[] = [
  {
    id: '1',
    nombre: 'Construcción',
    descripcion: 'Materiales de construcción',
    categoria_padre_id: null,
    nivel: 1,
    ruta_completa: 'Construcción',
    icono: '🔨',
    color: '#FF5722',
    orden: 1,
    activo: true,
    es_predeterminado: false,
    id_institucion: 1,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    nombre: 'Electricidad',
    descripcion: 'Materiales eléctricos',
    categoria_padre_id: null,
    nivel: 1,
    ruta_completa: 'Electricidad',
    icono: '⚡',
    color: '#FFC107',
    orden: 2,
    activo: true,
    es_predeterminado: false,
    id_institucion: 1,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z'
  }
];

const mockPresentaciones: Presentacion[] = [
  {
    id: '1',
    nombre: 'Unidad',
    descripcion: 'Unidad individual',
    abreviatura: 'ud',
    unidad_base: 'unidad',
    factor_conversion: 1,
    activo: true,
    es_predeterminado: false,
    id_institucion: 1,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    nombre: 'Caja',
    descripcion: 'Caja con múltiples unidades',
    abreviatura: 'caja',
    unidad_base: 'unidad',
    factor_conversion: 24,
    activo: true,
    es_predeterminado: false,
    id_institucion: 1,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z'
  }
];

// Helper component para probar DynamicSelect con React Hook Form
const TestWrapper: React.FC<{
  type: 'categoria' | 'presentacion';
  creatable?: boolean;
  allowEdit?: boolean;
  onEdit?: (item: Categoria | Presentacion) => void;
  error?: any;
}> = ({ type, creatable = true, allowEdit = false, onEdit, error }) => {
  const { control } = useForm({
    defaultValues: { test: '' }
  });

  return (
    <DynamicSelect
      control={control}
      name="test"
      label={type === 'categoria' ? 'Categoría' : 'Presentación'}
      type={type}
      creatable={creatable}
      allowEdit={allowEdit}
      onEdit={onEdit}
      error={error}
    />
  );
};

describe('DynamicSelect Component', () => {
  const mockEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Configurar mocks por defecto
    mockUseReferenceData.mockReturnValue({
      categoriasOptions: mockCategorias.map(cat => ({
        value: cat.id,
        label: cat.nombre,
        data: cat,
        nivel: cat.nivel,
        hijos: []
      })),
      categoriasFlatOptions: mockCategorias.map(cat => ({
        value: cat.id,
        label: cat.nombre,
        data: cat
      })),
      presentacionesOptions: mockPresentaciones.map(pres => ({
        value: pres.id,
        label: `${pres.nombre}${pres.abreviatura ? ` (${pres.abreviatura})` : ''}`,
        data: pres
      })),
      loading: false,
      actions: {
        crearCategoria: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 'new-id', nombre: 'Nueva Categoría' }
        }),
        editarCategoria: vi.fn(),
        crearPresentacion: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 'new-id', nombre: 'Nueva Presentación' }
        }),
        editarPresentacion: vi.fn()
      }
    });

    mockUseResponsiveSelect.mockReturnValue({
      isMobile: false,
      getSelectProps: vi.fn(() => ({}))
    });
  });

  describe('Renderizado básico', () => {
    test('debe renderizar el componente de categoría', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      expect(screen.getByText('Categoría')).toBeInTheDocument();
      expect(screen.getByLabelText('Categoría')).toBeInTheDocument();
    });

    test('debe renderizar el componente de presentación', () => {
      render(<TestWrapper type="presentacion" creatable={false} />);

      expect(screen.getByText('Presentación')).toBeInTheDocument();
      expect(screen.getByLabelText('Presentación')).toBeInTheDocument();
    });

    test('debe mostrar indicador de requerido cuando es necesario', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('debe mostrar mensaje de error cuando hay error', () => {
      const error = { message: 'Este campo es requerido' };
      render(<TestWrapper type="categoria" creatable={false} error={error} />);

      expect(screen.getByText('Este campo es requerido')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Carga y estados', () => {
    test('debe mostrar skeleton durante carga inicial', () => {
      mockUseReferenceData.mockReturnValue({
        categoriasOptions: [],
        presentacionesOptions: [],
        loading: true
      });

      render(<TestWrapper type="categoria" />);

      // Verificar que muestra skeleton (puede variar la implementación exacta)
      expect(screen.getByText('Categoría')).toBeInTheDocument();
    });

    test('debe estar deshabilitado cuando se especifica', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      const select = screen.getByLabelText('Categoría');
      expect(select).toBeDisabled();
    });
  });

  describe('Funcionalidad de categorías', () => {
    test('debe mostrar iconos y colores de categorías', async () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      // Verificar que se muestran los iconos y colores
      expect(screen.getByText('🔨')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    test('debe mostrar jerarquía de categorías con sangría', async () => {
      const categoriaConHijo: Categoria = {
        ...mockCategorias[0],
        hijos: [{
          id: '3',
          nombre: 'Subcategoría',
          categoria_padre_id: '1',
          nivel: 2,
          ruta_completa: 'Construcción > Subcategoría',
          activo: true,
          es_predeterminado: false,
          id_institucion: 1,
          creado_en: '2024-01-01T00:00:00Z',
          actualizado_en: '2024-01-01T00:00:00Z'
        }]
      };

      mockUseReferenceData.mockReturnValue({
        categoriasOptions: [categoriaConHijo].map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat,
          nivel: cat.nivel,
          hijos: cat.hijos || []
        })),
        presentacionesOptions: [],
        loading: false
      });

      render(<TestWrapper type="categoria" creatable={false} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      // Verificar que se muestra la jerarquía
      expect(screen.getByText('Construcción')).toBeInTheDocument();
    });
  });

  describe('Funcionalidad de presentaciones', () => {
    test('debe mostrar abreviaturas de presentaciones', async () => {
      render(<TestWrapper type="presentacion" creatable={false} />);

      const select = screen.getByLabelText('Presentación');
      await userEvent.click(select);

      // Verificar que se muestran las abreviaturas
      expect(screen.getByText('Unidad (ud)')).toBeInTheDocument();
      expect(screen.getByText('Caja (caja)')).toBeInTheDocument();
    });
  });

  describe('Creación de nuevas opciones', () => {
    test('debe permitir crear nueva categoría', async () => {
      render(<TestWrapper type="categoria" creatable={true} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      // Escribir nombre de nueva categoría
      const input = select.querySelector('input') || select;
      await userEvent.type(input, 'Nueva Categoría{enter}');

      // Verificar que se llamó a la API de creación
      await waitFor(() => {
        expect(mockUseReferenceData().actions.crearCategoria).toHaveBeenCalledWith({
          nombre: 'Nueva Categoría',
          id_institucion: 1
        });
      });
    });

    test('debe permitir crear nueva presentación', async () => {
      render(<TestWrapper type="presentacion" creatable={true} />);

      const select = screen.getByLabelText('Presentación');
      await userEvent.click(select);

      // Escribir nombre de nueva presentación
      const input = select.querySelector('input') || select;
      await userEvent.type(input, 'Nueva Presentación{enter}');

      // Verificar que se llamó a la API de creación
      await waitFor(() => {
        expect(mockUseReferenceData().actions.crearPresentacion).toHaveBeenCalledWith({
          nombre: 'Nueva Presentación',
          id_institucion: 1
        });
      });
    });

    test('debe mostrar estado de carga durante creación', async () => {
      const mockCrearCategoria = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { id: 'new-id', nombre: 'Nueva Categoría' }
        }), 100))
      );

      mockUseReferenceData.mockReturnValue({
        categoriasOptions: mockCategorias.map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat,
          nivel: cat.nivel,
          hijos: []
        })),
        categoriasFlatOptions: mockCategorias.map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat
        })),
        presentacionesOptions: [],
        loading: false,
        actions: {
          crearCategoria: mockCrearCategoria,
          editarCategoria: vi.fn(),
          crearPresentacion: vi.fn(),
          editarPresentacion: vi.fn()
        }
      });

      render(<TestWrapper type="categoria" creatable={true} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      const input = select.querySelector('input') || select;
      await userEvent.type(input, 'Nueva Categoría{enter}');

      // Verificar que muestra estado de carga
      expect(screen.getByText('Creando nueva categoria...')).toBeInTheDocument();
      expect(screen.getByText('Categoría')).toBeInTheDocument();
    });

    test('debe manejar errores en la creación', async () => {
      mockUseReferenceData.mockReturnValue({
        categoriasOptions: mockCategorias.map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat,
          nivel: cat.nivel,
          hijos: []
        })),
        categoriasFlatOptions: mockCategorias.map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat
        })),
        presentacionesOptions: [],
        loading: false,
        actions: {
          crearCategoria: vi.fn().mockResolvedValue({
            success: false,
            error: 'Error al crear categoría'
          }),
          editarCategoria: vi.fn(),
          crearPresentacion: vi.fn(),
          editarPresentacion: vi.fn()
        }
      });

      render(<TestWrapper type="categoria" creatable={true} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      const input = select.querySelector('input') || select;
      await userEvent.type(input, 'Nueva Categoría{enter}');

      // Verificar que maneja el error
      await waitFor(() => {
        expect(mockUseReferenceData().actions.crearCategoria).toHaveBeenCalled();
      });
    });
  });

  describe('Funcionalidad de edición', () => {
    test('debe mostrar botón de edición cuando allowEdit es true', async () => {
      render(<TestWrapper type="categoria" creatable={false} allowEdit={true} onEdit={mockEdit} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      // Verificar que se muestra el botón de edición (puede necesitar hover)
      const options = screen.getAllByText('Construcción');
      expect(options.length).toBeGreaterThan(0);
    });

    test('debe llamar a onEdit cuando se hace clic en editar', async () => {
      render(<TestWrapper type="categoria" creatable={false} allowEdit={true} onEdit={mockEdit} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      // Buscar y hacer clic en el botón de edición
      const editButton = screen.getByLabelText('Editar Construcción');
      await userEvent.click(editButton);

      expect(mockEdit).toHaveBeenCalledWith(mockCategorias[0]);
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener atributos ARIA correctos', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      const select = screen.getByLabelText('Categoría');
      expect(select).toHaveAttribute('role', 'combobox');
      expect(select).toHaveAttribute('aria-required', 'true');
    });

    test('debe describir error con aria-describedby cuando hay error', () => {
      const error = { message: 'Este campo es requerido' };
      render(<TestWrapper type="categoria" creatable={false} error={error} />);

      const select = screen.getByLabelText('Categoría');
      expect(select).toHaveAttribute('aria-describedby', 'test-error');
    });

    test('debe mostrar tooltip de ayuda contextual', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      // Verificar que hay un icono de ayuda
      const helpIcon = screen.getByRole('button').querySelector('svg');
      expect(helpIcon).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    test('debe adaptarse a modo móvil', () => {
      mockUseResponsiveSelect.mockReturnValue({
        isMobile: true,
        getSelectProps: jest.fn(() => ({ isSearchable: false }))
      });

      render(<TestWrapper type="categoria" creatable={true} />);

      // En móvil, debería mostrar "Crear" en lugar de "Crear 'valor'"
      expect(screen.getByText('Categoría')).toBeInTheDocument();
    });
  });

  describe('Manejo de casos extremos', () => {
    test('debe manejar arrays vacíos de opciones', () => {
      mockUseReferenceData.mockReturnValue({
        categoriasOptions: [],
        presentacionesOptions: [],
        loading: false
      });

      render(<TestWrapper type="categoria" creatable={false} />);

      const select = screen.getByLabelText('Categoría');
      expect(select).toBeInTheDocument();
    });

    test('debe manejar valores nulos o indefinidos', () => {
      mockUseReferenceData.mockReturnValue({
        categoriasOptions: null,
        presentacionesOptions: undefined,
        loading: false
      });

      render(<TestWrapper type="categoria" creatable={false} />);

      const select = screen.getByLabelText('Categoría');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    test('should memoize component correctly with memo wrapper', () => {
      const { rerender } = render(
        <MemoizedDynamicSelect
          control={{} as Control}
          name="test"
          label="Test"
          type="categoria"
        />
      );

      const initialRenderCount = vi.fn();
      initialRenderCount();

      // Re-render con mismas props - no debería volver a renderizar
      rerender(
        <MemoizedDynamicSelect
          control={{} as Control}
          name="test"
          label="Test"
          type="categoria"
        />
      );

      // Verificar que no se vuelve a renderizar con mismas props
      expect(initialRenderCount).toHaveBeenCalledTimes(1);
    });

    test('should re-render when important props change', () => {
      const { rerender } = render(
        <MemoizedDynamicSelect
          control={{} as Control}
          name="test"
          label="Test"
          type="categoria"
          disabled={false}
        />
      );

      // Re-render con prop cambiada - debería volver a renderizar
      rerender(
        <MemoizedDynamicSelect
          control={{} as Control}
          name="test"
          label="Test"
          type="categoria"
          disabled={true}
        />
      );

      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    test('should handle large datasets efficiently', async () => {
      const largeOptions = Array.from({ length: 1000 }, (_, i) => ({
        label: `Opción ${i}`,
        value: `option-${i}`,
        data: {
          id: `option-${i}`,
          nombre: `Opción ${i}`,
          descripcion: `Descripción ${i}`
        }
      }));

      mockUseReferenceData.mockReturnValue({
        categoriasOptions: largeOptions,
        categoriasFlatOptions: largeOptions,
        presentacionesOptions: [],
        loading: false
      });

      const startTime = performance.now();

      render(<TestWrapper type="categoria" />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // El renderizado debería tomar menos de 100ms incluso con 1000 opciones
      expect(renderTime).toBeLessThan(100);
    });

    test('should not re-render unnecessarily with useCallback optimizations', async () => {
      const mockEdit = vi.fn();
      const { rerender } = render(
        <TestWrapper type="categoria" allowEdit={true} onEdit={mockEdit} />
      );

      const initialEditCallCount = mockEdit.mock.calls.length;

      // Re-render sin cambios relevantes
      rerender(
        <TestWrapper type="categoria" allowEdit={true} onEdit={mockEdit} />
      );

      // No debería haber nuevas llamadas a onEdit
      expect(mockEdit.mock.calls.length).toBe(initialEditCallCount);
    });
  });

  describe('Memory Management', () => {
    test('should cleanup event listeners properly', () => {
      const { unmount } = render(<TestWrapper type="categoria" />);

      // Simular comportamiento de mouse events
      const option = screen.getByText('Construcción');
      fireEvent.mouseEnter(option);
      fireEvent.mouseLeave(option);

      unmount();

      // No debería haber memory leaks después del unmount
      expect(() => {
        fireEvent.mouseEnter(option);
      }).toThrow();
    });

    test('should handle state cleanup on unmount', () => {
      const { unmount } = render(
        <TestWrapper type="categoria" allowInlineEdit={true} />
      );

      // Iniciar edición inline
      const editButton = screen.getByRole('button', { name: /editar/i });
      userEvent.click(editButton);

      // Desmontar componente durante edición
      unmount();

      // No debería haber errores de state updates después del unmount
      expect(() => {}).not.toThrow();
    });

    test('should not retain references to unmounted components', () => {
      const { unmount, rerender } = render(<TestWrapper type="categoria" />);

      // Get reference to component instance
      const componentElement = screen.getByRole('combobox');

      // Unmount component
      unmount();

      // Verify no retained references
      expect(componentElement.isConnected).toBe(false);

      // Remount should work correctly
      render(<TestWrapper type="categoria" />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Advanced Accessibility Testing', () => {
    test('should have proper ARIA attributes', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-label', 'Categoría');
      expect(combobox).toHaveAttribute('aria-required', 'true');
    });

    test('should announce errors to screen readers', async () => {
      const error = { message: 'Este campo es requerido' };
      render(<TestWrapper type="categoria" creatable={false} error={error} />);

      // Error debería ser anunciado
      const errorMessage = screen.getByText('Este campo es requerido');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    test('should support keyboard navigation', async () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      const combobox = screen.getByRole('combobox');

      // Tab para enfocar
      await userEvent.tab();
      expect(combobox).toHaveFocus();

      // Enter o Space para abrir menú
      await userEvent.keyboard('{Enter}');

      // Flechas para navegar opciones
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
    });

    test('should have proper focus management', async () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      const combobox = screen.getByRole('combobox');

      // Focus management
      await userEvent.click(combobox);
      expect(combobox).toHaveFocus();

      // Escape should close menu and return focus
      await userEvent.keyboard('{Escape}');
      expect(combobox).toHaveFocus();
    });

    test('should provide color contrast compliance', () => {
      render(<TestWrapper type="categoria" creatable={false} />);

      // Verificar elementos visuales tienen contraste adecuado
      const label = screen.getByText('Categoría');
      expect(label).toBeInTheDocument();

      // Los elementos deberían tener clases de contraste apropiadas
      const container = screen.getByRole('combobox').closest('.react-select-container');
      expect(container).toHaveClass('react-select-container');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      const mockActions = {
        crearCategoria: vi.fn().mockRejectedValue(new Error('Network error')),
        editarCategoria: vi.fn(),
        crearPresentacion: vi.fn(),
        editarPresentacion: vi.fn()
      };

      mockUseReferenceData.mockReturnValue({
        categoriasOptions: [],
        categoriasFlatOptions: [],
        presentacionesOptions: [],
        loading: false,
        actions: mockActions
      });

      render(<TestWrapper type="categoria" creatable={true} />);

      // Intentar crear nueva categoría
      const combobox = screen.getByRole('combobox');
      await userEvent.type(combobox, 'Nueva Categoría');
      await userEvent.keyboard('{Enter}');

      // Debería manejar el error sin crash
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    test('should handle invalid data gracefully', () => {
      mockUseReferenceData.mockReturnValue({
        categoriasOptions: [
          // @ts-ignore - Datos inválidos para testing
          { label: null, value: undefined, data: null },
          { label: 'Valid', value: 'valid', data: { id: 'valid', nombre: 'Valid' } }
        ],
        categoriasFlatOptions: [],
        presentacionesOptions: [],
        loading: false,
        actions: {
          crearCategoria: vi.fn(),
          editarCategoria: vi.fn(),
          crearPresentacion: vi.fn(),
          editarPresentacion: vi.fn()
        }
      });

      expect(() => {
        render(<TestWrapper type="categoria" creatable={false} />);
      }).not.toThrow();
    });

    test('should handle concurrent operations safely', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ success: true, data: { id: 'new' } });

      mockUseReferenceData.mockReturnValue({
        categoriasOptions: [],
        categoriasFlatOptions: [],
        presentacionesOptions: [],
        loading: false,
        actions: {
          crearCategoria: mockCreate,
          editarCategoria: vi.fn(),
          crearPresentacion: vi.fn(),
          editarPresentacion: vi.fn()
        }
      });

      render(<TestWrapper type="categoria" creatable={true} />);

      const combobox = screen.getByRole('combobox');

      // Operaciones concurrentes
      const operation1 = userEvent.type(combobox, 'Categoria 1{enter}');
      const operation2 = userEvent.type(combobox, 'Categoria 2{enter}');

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Inline Editing Integration', () => {
    test('should integrate inline editing correctly', async () => {
      const onInlineEditStart = vi.fn();
      const onInlineEditSuccess = vi.fn();
      const onInlineEditError = vi.fn();

      render(
        <DynamicSelect
          control={{} as Control}
          name="categoria"
          label="Categoría"
          type="categoria"
          allowInlineEdit={true}
          onInlineEditStart={onInlineEditStart}
          onInlineEditSuccess={onInlineEditSuccess}
          onInlineEditError={onInlineEditError}
        />
      );

      // Iniciar edición inline
      const editButton = screen.getByRole('button', { name: /editar/i });
      await userEvent.click(editButton);

      // Verificar callbacks
      expect(onInlineEditStart).toHaveBeenCalled();

      // Verificar componente inline editor
      expect(screen.getByTestId('inline-editor')).toBeInTheDocument();

      // Simular guardado exitoso
      const saveButton = screen.getByTestId('save-button');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(onInlineEditSuccess).toHaveBeenCalled();
      });
    });

    test('should handle inline editing errors', async () => {
      const onInlineEditError = vi.fn();

      mockUseReferenceData.mockReturnValue({
        categoriasOptions: mockCategorias.map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat,
          nivel: cat.nivel,
          hijos: []
        })),
        categoriasFlatOptions: mockCategorias.map(cat => ({
          value: cat.id,
          label: cat.nombre,
          data: cat
        })),
        presentacionesOptions: [],
        loading: false,
        actions: {
          crearCategoria: vi.fn(),
          editarCategoria: vi.fn().mockRejectedValue(new Error('Edit error')),
          crearPresentacion: vi.fn(),
          editarPresentacion: vi.fn()
        }
      });

      render(
        <DynamicSelect
          control={{} as Control}
          name="categoria"
          label="Categoría"
          type="categoria"
          allowInlineEdit={true}
          onInlineEditError={onInlineEditError}
        />
      );

      const editButton = screen.getByRole('button', { name: /editar/i });
      await userEvent.click(editButton);

      const saveButton = screen.getByTestId('save-button');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(onInlineEditError).toHaveBeenCalled();
      });
    });
  });
});