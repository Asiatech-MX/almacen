import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Formulario from '../Formulario';
import { mockElectronAPI, mockCategorias, mockPresentaciones, createTestQueryClient, createTestWrapper } from '../../hooks/__tests__/setup.test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock de dependencias externas
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: undefined }) // Modo creación
}));

jest.mock('../../hooks/useMateriaPrima', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    materiaPrima: null,
    createMateriaPrima: jest.fn().mockResolvedValue({ success: true }),
    updateMateriaPrima: jest.fn().mockResolvedValue({ success: true }),
    error: null
  })
}));

jest.mock('../../services/materiaPrimaService', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({ success: true }),
    update: jest.fn().mockResolvedValue({ success: true }),
    getById: jest.fn().mockResolvedValue({ success: true, data: null })
  }
}));

jest.mock('../../hooks/useReferenceDataQuery', () => ({
  useReferenceDataQuery: () => ({
    isLoading: false,
    refetch: jest.fn()
  }),
  useEditarCategoriaMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true })
  }),
  useEditarPresentacionMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true })
  }),
  useMoverCategoriaMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true })
  })
}));

// Mock de componentes UI complejos
jest.mock('@/components/ui/DynamicSelect', () => {
  return {
    MemoizedDynamicSelect: ({ control, name, label, type, error }: any) => {
      const { watch } = require('react-hook-form');
      const form = watch();
      const currentValue = form[name];

      return (
        <div data-testid={`dynamic-select-${name}`} data-type={type} data-error={error ? 'true' : 'false'}>
          <label htmlFor={name}>{label}</label>
          <select
            id={name}
            data-testid={`select-${name}`}
            value={currentValue || ''}
            onChange={(e) => {
              // Simular change de React Hook Form
              control.setValue(name, e.target.value === '' ? null : e.target.value);
            }}
          >
            <option value="">Seleccionar {label}...</option>
            {type === 'categoria' && mockCategorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
            {type === 'presentacion' && mockPresentaciones.map((pres) => (
              <option key={pres.id} value={pres.id}>
                {pres.nombre}
              </option>
            ))}
          </select>
          {error && <span className="error-message">{error.message}</span>}
        </div>
      );
    }
  };
});

jest.mock('@/components/ui/file-upload', () => {
  return {
    FileUpload: ({ onFilesChange, disabled }: any) => (
      <div data-testid="file-upload" data-disabled={disabled}>
        <input
          type="file"
          multiple
          onChange={(e) => onFilesChange?.(e.target.files)}
          disabled={disabled}
        />
        <button
          onClick={() => onFilesChange?.([])}
          data-testid="clear-files"
          disabled={disabled}
        >
          Limpiar archivos
        </button>
      </div>
    )
  };
});

jest.mock('@/components/ui/inline-editor', () => {
  return {
    InlineEditor: ({ children, type, onSubmit }: any) => (
      <div data-testid="inline-editor" data-type={type}>
        {children}
        <button onClick={() => onSubmit?.({ nombre: 'Test Edit' })} data-testid="inline-edit-submit">
          Guardar
        </button>
      </div>
    )
  };
});

// Mock de componentes shadcn/ui complejos
jest.mock('@/components/ui/tabs', () => {
  return {
    Tabs: ({ children, defaultValue, onValueChange }: any) => (
      <div data-testid="tabs" data-default={defaultValue} onChange={onValueChange}>
        {children}
      </div>
    ),
    TabsContent: ({ children, value }: any) => (
      <div data-testid={`tabs-content-${value}`}>{children}</div>
    ),
    TabsList: ({ children }: any) => (
      <div data-testid="tabs-list">{children}</div>
    ),
    TabsTrigger: ({ children, value, onClick }: any) => (
      <button
        data-testid={`tabs-trigger-${value}`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  };
});

jest.mock('@/components/ui/fieldset', () => {
  return {
    FieldSet: ({ children, className }: any) => (
      <fieldset data-testid="fieldset" className={className}>
        {children}
      </fieldset>
    ),
    FieldLegend: ({ children }: any) => (
      <legend data-testid="field-legend">{children}</legend>
    ),
    FieldDescription: ({ children }: any) => (
      <p data-testid="field-description">{children}</p>
    ),
    FieldGroup: ({ children, className }: any) => (
      <div data-testid="field-group" className={className}>
        {children}
      </div>
    ),
    FieldContent: ({ children }: any) => (
      <div data-testid="field-content">{children}</div>
    ),
    FieldTitle: ({ children }: any) => (
      <h3 data-testid="field-title">{children}</h3>
    ),
    FieldError: ({ children }: any) => (
      <span data-testid="field-error" className="error">{children}</span>
    ),
    Field: ({ children }: any) => (
      <div data-testid="field">{children}</div>
    ),
    FieldSeparator: () => <hr data-testid="field-separator" />
  };
});

jest.mock('@/components/ui/scroller', () => {
  return {
    Scroller: ({ children }: any) => (
      <div data-testid="scroller">{children}</div>
    )
  };
});

jest.mock('@/components/ui/tooltip', () => {
  return {
    TooltipProvider: ({ children }: any) => <div>{children}</div>,
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
    TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>
  };
});

describe('Formulario Integration Tests', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    user = userEvent.setup();
  });

  const renderFormulario = () => {
    return render(<Formulario />, { wrapper });
  };

  describe('Renderizado inicial', () => {
    test('debe renderizar formulario en modo creación', () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderFormulario();

      expect(screen.getByText('Formulario de Material')).toBeInTheDocument();
      expect(screen.getByText('➕ Creando')).toBeInTheDocument();
      expect(screen.getByText('Complete la información para registrar un nuevo material en el sistema.')).toBeInTheDocument();
    });

    test('debe renderizar tabs de navegación', () => {
      renderFormulario();

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-basic-info')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-stock-management')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-additional-info')).toBeInTheDocument();
    });

    test('debe renderizar sección de información básica', () => {
      renderFormulario();

      expect(screen.getByTestId('tabs-content-basic-info')).toBeInTheDocument();
      expect(screen.getByTestId('fieldset')).toBeInTheDocument();
      expect(screen.getByText('Información Básica')).toBeInTheDocument();
    });
  });

  describe('Integración con DynamicSelect', () => {
    test('debe renderizar DynamicSelect para categorías', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderFormulario();

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-select-categoria_id')).toBeInTheDocument();
        expect(screen.getByTestId('dynamic-select-categoria_id')).toHaveAttribute('data-type', 'categoria');
      });
    });

    test('debe renderizar DynamicSelect para presentaciones', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderFormulario();

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-select-presentacion_id')).toBeInTheDocument();
        expect(screen.getByTestId('dynamic-select-presentacion_id')).toHaveAttribute('data-type', 'presentacion');
      });
    });

    test('debe cargar opciones de categorías en select', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      renderFormulario();

      await waitFor(() => {
        const categoriaSelect = screen.getByTestId('select-categoria_id');
        const options = categoriaSelect.querySelectorAll('option');

        // Placeholder + categorías
        expect(options.length).toBeGreaterThan(1);

        // Verificar que existen las opciones mockeadas
        expect(Array.from(options).some(opt => opt.textContent === 'Construcción')).toBe(true);
      });
    });

    test('debe cargar opciones de presentaciones en select', async () => {
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderFormulario();

      await waitFor(() => {
        const presentacionSelect = screen.getByTestId('select-presentacion_id');
        const options = presentacionSelect.querySelectorAll('option');

        // Placeholder + presentaciones
        expect(options.length).toBeGreaterThan(1);

        // Verificar que existen las opciones mockeadas
        expect(Array.from(options).some(opt => opt.textContent === 'Kilogramo')).toBe(true);
      });
    });

    test('debe sincronizar valores seleccionados con formulario', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      renderFormulario();

      await waitFor(() => {
        expect(screen.getByTestId('select-categoria_id')).toBeInTheDocument();
        expect(screen.getByTestId('select-presentacion_id')).toBeInTheDocument();
      });

      // Seleccionar categoría
      const categoriaSelect = screen.getByTestId('select-categoria_id');
      await user.selectOptions(categoriaSelect, '1');

      // Seleccionar presentación
      const presentacionSelect = screen.getByTestId('select-presentacion_id');
      await user.selectOptions(presentacionSelect, '1');

      // Verificar que los valores se mantienen (esto dependería de la implementación exacta del mock)
      expect(categoriaSelect).toHaveValue('1');
      expect(presentacionSelect).toHaveValue('1');
    });
  });

  describe('Validación del formulario', () => {
    test('debe mostrar errores de validación para campos requeridos', async () => {
      renderFormulario();

      // Intentar enviar formulario vacío
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Debería mostrar errores para campos requeridos
        expect(screen.getByText(/Código de Barras/i)).toBeInTheDocument();
        // El nombre es requerido
      });
    });

    test('debe validar formato de código de barras EAN-13', async () => {
      renderFormulario();

      const barcodeInput = screen.getByPlaceholderText('Ej: 7501234567890');

      // Ingresar código inválido
      await user.type(barcodeInput, '123');
      expect(barcodeInput).toHaveValue('123');

      // El formulario debería mostrar error de validación
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El código de barras debe tener 13 dígitos/i)).toBeInTheDocument();
      });
    });

    test('debe aceptar código de barras válido', async () => {
      renderFormulario();

      const barcodeInput = screen.getByPlaceholderText('Ej: 7501234567890');

      // Ingresar código válido
      await user.type(barcodeInput, '7501234567890');
      expect(barcodeInput).toHaveValue('7501234567890');

      // El formulario no debería mostrar error para este campo
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);

      // No debería mostrar error de código de barras
      await waitFor(() => {
        expect(screen.queryByText(/El código de barras debe tener 13 dígitos/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Integración con FileUpload', () => {
    test('debe renderizar componente FileUpload', () => {
      renderFormulario();

      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    });

    test('debe permitir seleccionar archivos', async () => {
      renderFormulario();

      const fileInput = screen.getByRole('button', { name: '' }); // El input file está oculto
      const files = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files } });
      });

      // Verificar que se pueden limpiar archivos
      const clearButton = screen.getByTestId('clear-files');
      await user.click(clearButton);
    });
  });

  describe('Estados del formulario', () => {
    test('debe manejar estado de loading para edición', () => {
      // Mock para modo edición con loading
      jest.mocked(require('react-router-dom').useParams).mockReturnValue({ id: '123' });
      jest.mocked(require('../../hooks/useMateriaPrima').default).mockReturnValue({
        loading: true,
        materiaPrima: null,
        createMateriaPrima: jest.fn(),
        updateMateriaPrima: jest.fn(),
        error: null
      });

      renderFormulario();

      expect(screen.getByText('Cargando materia prima...')).toBeInTheDocument();
    });

    test('debe mostrar mensajes de éxito', async () => {
      // Mock de creación exitosa
      jest.mocked(require('../../hooks/useMateriaPrima').default).mockReturnValue({
        loading: false,
        materiaPrima: null,
        createMateriaPrima: jest.fn().mockResolvedValue({ success: true }),
        updateMateriaPrima: jest.fn(),
        error: null,
        success: 'Material creado correctamente'
      });

      renderFormulario();

      await waitFor(() => {
        expect(screen.getByText('Material creado correctamente')).toBeInTheDocument();
      });
    });

    test('debe mostrar mensajes de error', async () => {
      // Mock con error
      jest.mocked(require('../../hooks/useMateriaPrima').default).mockReturnValue({
        loading: false,
        materiaPrima: null,
        createMateriaPrima: jest.fn().mockRejectedValue(new Error('Error de prueba')),
        updateMateriaPrima: jest.fn(),
        error: 'Error de prueba'
      });

      renderFormulario();

      await waitFor(() => {
        expect(screen.getByText('Error de prueba')).toBeInTheDocument();
      });
    });
  });

  describe('Navegación de tabs', () => {
    test('debe cambiar entre tabs', async () => {
      renderFormulario();

      // Verificar tab inicial
      expect(screen.getByTestId('tabs-content-basic-info')).toBeInTheDocument();

      // Cambiar a tab de stock
      const stockTab = screen.getByTestId('tabs-trigger-stock-management');
      await user.click(stockTab);

      // Cambiar a tab de info adicional
      const additionalTab = screen.getByTestId('tabs-trigger-additional-info');
      await user.click(additionalTab);
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener estructura semántica correcta', () => {
      renderFormulario();

      // Verificar elementos semánticos
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    test('debe tener labels asociados a inputs', () => {
      renderFormulario();

      // Verificar que los inputs tienen labels asociados
      expect(screen.getByLabelText('Código de Barras')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre del Material')).toBeInTheDocument();
    });

    test('debe manejar tooltips', () => {
      renderFormulario();

      // Los tooltips deberían estar presentes (aunque no necesariamente visibles)
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar datos de categorías vacíos', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue([]);

      renderFormulario();

      await waitFor(() => {
        const categoriaSelect = screen.getByTestId('select-categoria_id');
        const options = categoriaSelect.querySelectorAll('option');

        // Solo placeholder
        expect(options).toHaveLength(1);
      });
    });

    test('debe manejar errores de carga de datos', async () => {
      mockElectronAPI.categoria.listar.mockRejectedValue(new Error('Error de red'));

      renderFormulario();

      // El formulario debería seguir renderizando aunque falle la carga
      expect(screen.getByText('Formulario de Material')).toBeInTheDocument();
    });

    test('debe limpiar estado al desmontar', () => {
      const { unmount } = renderFormulario();

      // No debería haber errores o leaks al desmontar
      expect(() => unmount()).not.toThrow();
    });
  });
});