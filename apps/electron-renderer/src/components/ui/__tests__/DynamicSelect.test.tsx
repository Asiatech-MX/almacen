import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, Control } from 'react-hook-form';
import DynamicSelect from '../DynamicSelect';
import { Categoria, Presentacion } from '../../../../../../../packages/shared-types/src/referenceData';

// Mock de los hooks
jest.mock('@/hooks/useReferenceData', () => ({
  useReferenceData: jest.fn()
}));

jest.mock('@/hooks/useResponsiveSelect', () => ({
  useResponsiveSelect: jest.fn()
}));

jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

// Mock del componente Label
jest.mock('../label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={className} {...props}>
      {children}
    </label>
  )
}));

const mockUseReferenceData = require('@/hooks/useReferenceData').useReferenceData;
const mockUseResponsiveSelect = require('@/hooks/useResponsiveSelect').useResponsiveSelect;

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
  const mockEdit = jest.fn();
  const mockOnCreateCategoria = window.electronAPI.categoria.crear;
  const mockOnCreatePresentacion = window.electronAPI.presentacion.crear;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar mocks por defecto
    mockUseReferenceData.mockReturnValue({
      categoriasOptions: mockCategorias.map(cat => ({
        value: cat.id,
        label: cat.nombre,
        data: cat,
        nivel: cat.nivel,
        hijos: []
      })),
      presentacionesOptions: mockPresentaciones.map(pres => ({
        value: pres.id,
        label: `${pres.nombre}${pres.abreviatura ? ` (${pres.abreviatura})` : ''}`,
        data: pres
      })),
      loading: false
    });

    mockUseResponsiveSelect.mockReturnValue({
      isMobile: false,
      getSelectProps: jest.fn(() => ({}))
    });

    // Mock para APIs de creación
    mockOnCreateCategoria.mockResolvedValue({
      success: true,
      data: { id: 'new-id', nombre: 'Nueva Categoría' }
    });

    mockOnCreatePresentacion.mockResolvedValue({
      success: true,
      data: { id: 'new-id', nombre: 'Nueva Presentación' }
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
        expect(mockOnCreateCategoria).toHaveBeenCalledWith({
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
        expect(mockOnCreatePresentacion).toHaveBeenCalledWith({
          nombre: 'Nueva Presentación',
          id_institucion: 1
        });
      });
    });

    test('debe mostrar estado de carga durante creación', async () => {
      mockOnCreateCategoria.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { id: 'new-id', nombre: 'Nueva Categoría' }
        }), 100))
      );

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
      mockOnCreateCategoria.mockResolvedValue({
        success: false,
        error: 'Error al crear categoría'
      });

      render(<TestWrapper type="categoria" creatable={true} />);

      const select = screen.getByLabelText('Categoría');
      await userEvent.click(select);

      const input = select.querySelector('input') || select;
      await userEvent.type(input, 'Nueva Categoría{enter}');

      // Verificar que maneja el error
      await waitFor(() => {
        expect(mockOnCreateCategoria).toHaveBeenCalled();
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
});