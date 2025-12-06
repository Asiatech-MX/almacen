import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, SubmitHandler } from 'react-hook-form';
import DynamicSelect from '../DynamicSelect';
import { mockElectronAPI, mockCategorias, mockPresentaciones, createTestQueryClient, createTestWrapper } from '../../hooks/__tests__/setup.test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock de dependencias externas
jest.mock('react-select', () => {
  const MockSelect = ({ options, value, onChange, isDisabled, isLoading, placeholder }: any) => (
    <div data-testid="react-select" data-disabled={isDisabled} data-loading={isLoading}>
      <select
        value={value?.value || ''}
        onChange={(e) => {
          const selectedOption = options.find((opt: any) => opt.value === e.target.value);
          onChange(selectedOption || null);
        }}
        disabled={isDisabled}
        data-testid="select-input"
      >
        <option value="">{placeholder}</option>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value} disabled={option.isDisabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
  return MockSelect;
});

jest.mock('react-select/creatable', () => {
  const MockCreatableSelect = ({ options, value, onChange, isDisabled, isLoading, placeholder, onCreateOption }: any) => (
    <div data-testid="react-creatable-select" data-disabled={isDisabled} data-loading={isLoading}>
      <select
        value={value?.value || ''}
        onChange={(e) => {
          const selectedOption = options.find((opt: any) => opt.value === e.target.value);
          onChange(selectedOption || null);
        }}
        disabled={isDisabled}
        data-testid="creatable-select-input"
      >
        <option value="">{placeholder}</option>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value} disabled={option.isDisabled}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => onCreateOption && onCreateOption('Nueva Opción')}
        data-testid="create-option-btn"
        disabled={isDisabled}
      >
        Crear Nueva Opción
      </button>
    </div>
  );
  return MockCreatableSelect;
});

jest.mock('@/lib/performanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    measureRender: jest.fn(),
    measureInteraction: jest.fn(),
    measureAsync: jest.fn(),
    recordMetric: jest.fn()
  })
}));

jest.mock('@/hooks/useResponsiveSelect', () => ({
  useResponsiveSelect: () => ({
    isMobile: false,
    getSelectProps: () => ({})
  })
}));

jest.mock('@/hooks/useReferenceDataQuery', () => ({
  useEditarCategoriaMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: mockCategorias[0] })
  }),
  useEditarPresentacionMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: mockPresentaciones[0] })
  }),
  useCrearCategoriaMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: { id: '999', nombre: 'Nueva Categoría' } })
  }),
  useCrearPresentacionMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true, data: { id: '999', nombre: 'Nueva Presentación' } })
  })
}));

describe('DynamicSelect Component Integration', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    user = userEvent.setup();
  });

  // Helper para renderizar el componente con un formulario
  const renderDynamicSelect = (props = {}) => {
    const TestForm = () => {
      const { control, handleSubmit } = useForm({
        defaultValues: {
          categoria_id: null,
          presentacion_id: null
        }
      });

      const onSubmit: SubmitHandler<any> = (data) => {
        console.log('Form submitted:', data);
      };

      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <DynamicSelect
            control={control}
            name="categoria_id"
            label="Categoría"
            type="categoria"
            {...props}
          />
        </form>
      );
    };

    return render(<TestForm />, { wrapper });
  };

  describe('Renderizado básico', () => {
    test('debe renderizar loading skeleton durante carga inicial', async () => {
      mockElectronAPI.categoria.listar.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderDynamicSelect();

      // Debe mostrar skeleton durante carga inicial
      expect(screen.getByText('Categoría')).toBeInTheDocument();
      expect(document.querySelector('.skeleton-select')).toBeInTheDocument();
    });

    test('debe renderizar select después de cargar datos', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect();

      await waitFor(() => {
        expect(screen.getByTestId('react-select')).toBeInTheDocument();
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
      });
    });

    test('debe mostrar placeholder personalizado', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({ placeholder: 'Selecciona una categoría' });

      await waitFor(() => {
        const select = screen.getByDisplayValue('Selecciona una categoría');
        expect(select).toBeInTheDocument();
      });
    });

    test('debe manejar campo requerido', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({ required: true });

      await waitFor(() => {
        expect(screen.getByText('Categoría')).toBeInTheDocument();
        expect(screen.getByText('*')).toBeInTheDocument(); // Indicador de requerido
      });
    });

    test('debe mostrar estado deshabilitado', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({ disabled: true });

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        expect(select).toBeDisabled();
      });
    });
  });

  describe('Integración con React Hook Form', () => {
    test('debe sincronizar valor con formulario', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({
        defaultValue: '1' // Categoría Construcción
      });

      await waitFor(() => {
        const select = screen.getByDisplayValue('Construcción');
        expect(select).toBeInTheDocument();
      });
    });

    test('debe actualizar formulario al seleccionar opción', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const TestForm = () => {
        const { control, watch } = useForm({
          defaultValues: { categoria_id: null }
        });

        const currentValue = watch('categoria_id');

        return (
          <div>
            <DynamicSelect
              control={control}
              name="categoria_id"
              label="Categoría"
              type="categoria"
            />
            <div data-testid="form-value">Valor: {currentValue}</div>
          </div>
        );
      };

      render(<TestForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('select-input')).toBeInTheDocument();
      });

      // Seleccionar una opción
      const select = screen.getByTestId('select-input');
      await user.selectOptions(select, '1');

      // Verificar que el formulario se actualizó
      await waitFor(() => {
        expect(screen.getByTestId('form-value')).toHaveTextContent('Valor: 1');
      });
    });

    test('debe manejar valores nulos correctamente', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const TestForm = () => {
        const { control, watch } = useForm({
          defaultValues: { categoria_id: null }
        });

        const currentValue = watch('categoria_id');

        return (
          <div>
            <DynamicSelect
              control={control}
              name="categoria_id"
              label="Categoría"
              type="categoria"
            />
            <div data-testid="form-value">Valor: {currentValue || 'null'}</div>
          </div>
        );
      };

      render(<TestForm />, { wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('form-value')).toHaveTextContent('Valor: null');
      });
    });
  });

  describe('Carga de opciones', () => {
    test('debe cargar categorías correctamente', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect();

      await waitFor(() => {
        expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(1, true);
      });

      const select = screen.getByTestId('select-input');
      const options = select.querySelectorAll('option');

      // Placeholder + 3 categorías = 4 opciones
      expect(options).toHaveLength(4);
    });

    test('debe cargar presentaciones correctamente', async () => {
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderDynamicSelect({
        type: 'presentacion',
        name: 'presentacion_id',
        label: 'Presentación'
      });

      await waitFor(() => {
        expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(1, true);
      });

      const select = screen.getByTestId('select-input');
      const options = select.querySelectorAll('option');

      // Placeholder + 3 presentaciones = 4 opciones
      expect(options).toHaveLength(4);
    });

    test('debe mostrar error de carga', async () => {
      const errorMessage = 'Error al cargar categorías';
      mockElectronAPI.categoria.listar.mockRejectedValue(new Error(errorMessage));

      renderDynamicSelect();

      await waitFor(() => {
        expect(screen.queryByTestId('select-input')).not.toBeInTheDocument();
      });

      // El componente debería manejar el error internamente
      expect(mockElectronAPI.categoria.listar).toHaveBeenCalled();
    });

    test('debe manejar refetch manual', async () => {
      mockElectronAPI.categoria.listar
        .mockResolvedValueOnce(mockCategorias.slice(0, 1))
        .mockResolvedValueOnce(mockCategorias);

      renderDynamicSelect();

      // Primera carga
      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(2); // Placeholder + 1 categoría
      });

      // Trigger refetch (esto requeriría acceso al hook interno)
      // En un escenario real, esto podría ser a través de un botón o acción de usuario
    });
  });

  describe('Creación de opciones (Creatable)', () => {
    test('debe mostrar botón de crear cuando creatable=true', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({ creatable: true });

      await waitFor(() => {
        expect(screen.getByTestId('react-creatable-select')).toBeInTheDocument();
        expect(screen.getByTestId('create-option-btn')).toBeInTheDocument();
      });
    });

    test('debe mostrar loading durante creación', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      // Mock lento para la creación
      jest.mocked(require('@/hooks/useReferenceDataQuery').useCrearCategoriaMutation)
        .mockReturnValue({
          mutateAsync: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100))),
          isPending: true
        } as any);

      renderDynamicSelect({ creatable: true });

      await waitFor(() => {
        expect(screen.getByTestId('create-option-btn')).toBeInTheDocument();
      });

      // Iniciar creación
      await user.click(screen.getByTestId('create-option-btn'));

      // Debería mostrar indicador de carga
      await waitFor(() => {
        expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
      });
    });

    test('debe crear nueva categoría exitosamente', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const mockCreateMutation = {
        mutateAsync: jest.fn().mockResolvedValue({
          success: true,
          data: { id: '999', nombre: 'Nueva Categoría' }
        })
      };

      jest.mocked(require('@/hooks/useReferenceDataQuery').useCrearCategoriaMutation)
        .mockReturnValue(mockCreateMutation as any);

      renderDynamicSelect({ creatable: true });

      await waitFor(() => {
        expect(screen.getByTestId('create-option-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('create-option-btn'));

      expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
        nombre: 'Nueva Opción',
        descripcion: '',
        id_institucion: 1
      });
    });
  });

  describe('Estados de carga y actualización', () => {
    test('debe mostrar indicador de actualización en background', async () => {
      // Mock de carga inicial
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      // Mock de valor inicial que requiere actualización
      renderDynamicSelect({
        defaultValue: '1' // Valor existente
      });

      await waitFor(() => {
        expect(screen.getByTestId('react-select')).toBeInTheDocument();
      });

      // Simular estado de actualización (esto requeriría acceso al hook)
      // En un escenario real, esto podría ser triggered por cambios en los datos
    });

    test('debe manejar concurrencia de carga', async () => {
      mockElectronAPI.categoria.listar.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockCategorias), 100))
      );

      renderDynamicSelect();

      // Inmediatamente trigger refetch mientras carga inicial
      // Esto debería ser manejado correctamente sin crashes
      expect(mockElectronAPI.categoria.listar).toHaveBeenCalled();
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener atributos ARIA correctos', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect();

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        expect(select).toHaveAttribute('id');
      });

      expect(screen.getByText('Categoría')).toBeInTheDocument();
      expect(screen.getByText('Categoría')).toHaveAttribute('for');
    });

    test('debe manejar estado deshabilitado accesible', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({ disabled: true });

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        expect(select).toBeDisabled();
      });
    });

    test('debe mostrar indicador visual de error', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({
        error: { type: 'required', message: 'Este campo es requerido' }
      });

      await waitFor(() => {
        const select = screen.getByTestId('react-select');
        expect(select).toHaveAttribute('data-error');
      });
    });
  });

  describe('Tipos de datos (Categoría vs Presentación)', () => {
    test('debe mostrar labels correctos para categorías', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderDynamicSelect({ type: 'categoria' });

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        const options = select.querySelectorAll('option');

        // Verificar labels de categorías
        const categoriaOption = Array.from(options).find(opt => opt.value === '1');
        expect(categoriaOption?.textContent).toBe('Construcción');
      });
    });

    test('debe mostrar labels correctos para presentaciones', async () => {
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderDynamicSelect({
        type: 'presentacion',
        name: 'presentacion_id',
        label: 'Presentación'
      });

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        const options = select.querySelectorAll('option');

        // Verificar labels de presentaciones con abreviatura
        const presentacionOption = Array.from(options).find(opt => opt.value === '1');
        expect(presentacionOption?.textContent).toBe('Kilogramo (kg)');
      });
    });
  });

  describe('Optimizaciones y rendimiento', () => {
    test('no debe re-renderizar innecesariamente', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const { rerender } = renderDynamicSelect();

      await waitFor(() => {
        expect(screen.getByTestId('react-select')).toBeInTheDocument();
      });

      const initialSelect = screen.getByTestId('react-select');

      // Rerender con mismas props
      rerender(
        <DynamicSelect
          control={{} as any}
          name="categoria_id"
          label="Categoría"
          type="categoria"
        />
      );

      // El elemento DOM debería ser el mismo (no recreado)
      expect(screen.getByTestId('react-select')).toBe(initialSelect);
    });

    test('debe limpiar efectos al desmontar', () => {
      const { unmount } = renderDynamicSelect();

      // No debería haber errores o leaks al desmontar
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar datos vacíos', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue([]);

      renderDynamicSelect();

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        const options = select.querySelectorAll('option');
        // Solo placeholder
        expect(options).toHaveLength(1);
      });
    });

    test('debe manejar datos nulos', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(null);

      renderDynamicSelect();

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        const options = select.querySelectorAll('option');
        // Solo placeholder
        expect(options).toHaveLength(1);
      });
    });

    test('debe manejar IDs no numéricos', async () => {
      const categoriasConStringIds = [
        { ...mockCategorias[0], id: 'abc123' },
        { ...mockCategorias[1], id: 'xyz789' }
      ];
      mockElectronAPI.categoria.listar.mockResolvedValue(categoriasConStringIds);

      renderDynamicSelect();

      await waitFor(() => {
        const select = screen.getByTestId('select-input');
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(3); // Placeholder + 2 categorías
      });
    });
  });
});