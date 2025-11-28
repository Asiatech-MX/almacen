import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MateriaPrimaFormulario } from '../Formulario';
import { MateriaPrimaDetail } from '../../../../../../../shared/types/materiaPrima';

// Mock de hooks y servicios
jest.mock('../../hooks/useMateriaPrima', () => ({
  useMateriaPrima: jest.fn()
}));

jest.mock('../../hooks/useReferenceData', () => ({
  useReferenceData: jest.fn()
}));

jest.mock('../../services/materiaPrimaService', () => ({
  materiaPrimaService: {
    subirImagen: jest.fn()
  }
}));

jest.mock('../../utils/formDataNormalizer', () => ({
  prepareFormDataForSubmission: jest.fn((data) => data),
  extractValidationErrors: jest.fn((error) => ({
    generalError: error?.message || 'Error general',
    fieldErrors: {}
  }))
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn()
}));

// Mock del componente DynamicSelect
jest.mock('@/components/ui/DynamicSelect', () => ({
  DynamicSelect: ({ control, name, label, type, error, allowEdit, onEdit }: any) => (
    <div data-testid={`dynamic-select-${type}`}>
      <label>{label}</label>
      <input data-testid={`select-${name}`} />
      {allowEdit && (
        <button data-testid={`edit-${type}`} onClick={() => onEdit && onEdit({ id: 'test-id', nombre: 'Test' })}>
          Editar {type}
        </button>
      )}
      {error && <span className="error">{error.message}</span>}
    </div>
  )
}));

// Mock del componente InlineEditModal
jest.mock('@/components/ui/InlineEditModal', () => ({
  InlineEditModal: ({ isOpen, onClose, item, type, onSave }: any) =>
    isOpen ? (
      <div role="dialog" data-testid={`inline-edit-modal-${type}`}>
        <div data-testid="modal-type">{type}</div>
        <div data-testid="modal-item">{item?.nombre || 'new'}</div>
        <button onClick={() => onClose()}>Close</button>
        <button
          onClick={() => onSave(item ? { ...item, nombre: 'Updated' } : { nombre: 'New Item' })}
          data-testid="save-button"
        >
          Save
        </button>
      </div>
    ) : null
}));

// Mock de componentes UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, value, onChange, placeholder, type }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
    />
  )
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children, onSubmit }: any) => <form onSubmit={onSubmit}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ control, name, children }: any) => <div data-testid={`field-${name}`}>{children}</div>,
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: ({ children }: any) => <span>{children}</span>
}));

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  Controller: ({ render }: any) => render({
    field: { onChange: jest.fn(), onBlur: jest.fn(), value: '', name: '' },
    fieldState: { error: null }
  })
}));

const mockUseMateriaPrima = require('../../hooks/useMateriaPrima').useMateriaPrima;
const mockUseReferenceData = require('../../hooks/useReferenceData').useReferenceData;
const mockNavigate = require('react-router-dom').useNavigate;
const mockUseParams = require('react-router-dom').useParams;

// Mock data
const mockMateriaPrima: MateriaPrimaDetail = {
  id: '1',
  codigo_barras: '1234567890123',
  nombre: 'Material de Prueba',
  marca: 'Marca Test',
  modelo: 'Modelo Test',
  presentacion: 'Unidad',
  categoria: 'Construcción',
  presentacion_id: 'presentacion-1',
  categoria_id: 'categoria-1',
  stock_actual: 100,
  stock_minimo: 10,
  costo_unitario: 50.50,
  fecha_caducidad: '2024-12-31',
  imagen_url: 'https://example.com/image.jpg',
  descripcion: 'Descripción de prueba',
  proveedor_id: 'proveedor-1',
  id_institucion: 1,
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z'
};

const mockCategorias = [
  {
    id: 'categoria-1',
    nombre: 'Construcción',
    activo: true,
    id_institucion: 1
  },
  {
    id: 'categoria-2',
    nombre: 'Electricidad',
    activo: true,
    id_institucion: 1
  }
];

const mockPresentaciones = [
  {
    id: 'presentacion-1',
    nombre: 'Unidad',
    abreviatura: 'ud',
    activo: true,
    id_institucion: 1
  },
  {
    id: 'presentacion-2',
    nombre: 'Kilogramo',
    abreviatura: 'kg',
    activo: true,
    id_institucion: 1
  }
];

describe('MateriaPrimaFormulario Component', () => {
  const mockCrearMaterial = jest.fn();
  const mockActualizarMaterial = jest.fn();
  const mockObtenerMaterial = jest.fn();
  const mockActions = {
    editarPresentacion: jest.fn(),
    editarCategoria: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar mocks por defecto
    mockUseMateriaPrima.mockReturnValue({
      crearMaterial: mockCrearMaterial,
      actualizarMaterial: mockActualizarMaterial,
      obtenerMaterial: mockObtenerMaterial,
      loading: false,
      error: null,
      clearError: jest.fn()
    });

    mockUseReferenceData.mockReturnValue({
      categorias: mockCategorias,
      categoriasArbol: mockCategorias,
      presentaciones: mockPresentaciones,
      loading: false,
      actions: mockActions
    });

    mockNavigate.mockImplementation(() => {});

    // Mock de useParams
    mockUseParams.mockReturnValue({});

    // Mock de materiaPrimaService
    require('../../services/materiaPrimaService').materiaPrismaService.subirImagen.mockResolvedValue({
      success: true,
      url: 'https://example.com/uploaded-image.jpg'
    });
  });

  describe('Renderizado inicial', () => {
    test('debe renderizar formulario de creación', () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      expect(screen.getByDisplayValue('1234567890123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Unidad')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-select-categoria')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-select-presentacion')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // stock_actual
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // stock_minimo
    });

    test('debe renderizar formulario de edición', async () => {
      mockObtenerMaterial.mockResolvedValue(mockMateriaPrima);
      mockUseParams.mockReturnValue({ id: '1' });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario materialId="1" />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockObtenerMaterial).toHaveBeenCalledWith('1');
        expect(screen.getByDisplayValue(mockMateriaPrima.nombre)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockMateriaPrima.codigo_barras)).toBeInTheDocument();
      });
    });
  });

  describe('Validación del formulario', () => {
    test('debe validar código de barras EAN-13', async () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      // Debe mostrar error de validación para código de barras inválido
      expect(screen.getByText(/El código de barras debe tener exactamente 13 dígitos/)).toBeInTheDocument();
    });

    test('debe validar nombre requerido', async () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Limpiar campo nombre
      const codigoInput = screen.getByDisplayValue('1234567890123');
      await userEvent.clear(codigoInput);
      await userEvent.type(codigoInput, '1234567890123'); // Código válido

      const nombreInput = screen.getByDisplayValue('');
      await userEvent.type(nombreInput, '{backspace}'); // Borrar valor

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/El nombre es requerido/)).toBeInTheDocument();
    });
  });

  describe('Integración con DynamicSelect', () => {
    test('debe mostrar botones de edición para DynamicSelect', () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      expect(screen.getByTestId('edit-categoria')).toBeInTheDocument();
      expect(screen.getByTestId('edit-presentacion')).toBeInTheDocument();
    });

    test('debe abrir modal al hacer clic en editar categoría', async () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const editCategoriaButton = screen.getByTestId('edit-categoria');
      await userEvent.click(editCategoriaButton);

      expect(screen.getByTestId('inline-edit-modal-categoria')).toBeInTheDocument();
    });

    test('debe abrir modal al hacer clic en editar presentación', async () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const editPresentacionButton = screen.getByTestId('edit-presentacion');
      await userEvent.click(editPresentacionButton);

      expect(screen.getByTestId('inline-edit-modal-presentacion')).toBeInTheDocument();
    });
  });

  describe('Manejo de imágenes', () => {
    test('debe manejar carga de imagen', async () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const fileInput = screen.getByLabelText(/Imagen/i) || screen.getByTestId('file-upload');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(require('../../services/materiaPrimaService').materiaPrismaService.subirImagen).toHaveBeenCalledWith(
          file,
          expect.objectContaining({
            materiaPrimaId: 'temp',
            codigoBarras: '1234567890123',
            nombre: ''
          })
        );
      });
    });

    test('debe mostrar error si falla la carga de imagen', async () => {
      require('../../services/materiaPrimaService').materiaPrismaService.subirImagen.mockResolvedValue({
        success: false,
        error: 'Error al subir imagen'
      });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const fileInput = screen.getByLabelText(/Imagen/i) || screen.getByTestId('file-upload');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Error al subir imagen/)).toBeInTheDocument();
      });
    });

    test('debe permitir remover imagen', () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Simular que ya hay una imagen cargada
      const removeButton = screen.getByText(/Remover/i);
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('Backward compatibility', () => {
    test('debe manejar campos de texto y IDs simultáneamente', async () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Llenar formulario con datos mixtos
      const codigoInput = screen.getByDisplayValue('1234567890123');
      await userEvent.clear(codigoInput);
      await userEvent.type(codigoInput, '1234567890123');

      const nombreInput = screen.getByDisplayValue('');
      await userEvent.type(nombreInput, 'Material Test');

      // El formulario debe manejar la compatibilidad sin errores
      expect(screen.getByText('Material Test')).toBeInTheDocument();
    });
  });

  describe('Envío del formulario', () => {
    test('debe crear nuevo material con datos válidos', async () => {
      mockCrearMaterial.mockResolvedValue(mockMateriaPrima);

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Llenar formulario con datos válidos
      const codigoInput = screen.getByDisplayValue('1234567890123');
      await userEvent.clear(codigoInput);
      await userEvent.type(codigoInput, '1234567890123');

      const nombreInput = screen.getByDisplayValue('');
      await userEvent.type(nombreInput, 'Material Test');

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCrearMaterial).toHaveBeenCalledWith(
          expect.objectContaining({
            codigo_barras: '1234567890123',
            nombre: 'Material Test',
            presentacion: 'Unidad',
            id_institucion: 1
          })
        );
      });
    });

    test('debe actualizar material existente', async () => {
      mockObtenerMaterial.mockResolvedValue(mockMateriaPrima);
      mockActualizarMaterial.mockResolvedValue({
        ...mockMateriaPrima,
        nombre: 'Material Actualizado'
      });

      mockUseParams.mockReturnValue({ id: '1' });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario materialId="1" />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockMateriaPrima.nombre)).toBeInTheDocument();
      });

      const nombreInput = screen.getByDisplayValue(mockMateriaPrima.nombre);
      await userEvent.clear(nombreInput);
      await userEvent.type(nombreInput, 'Material Actualizado');

      const submitButton = screen.getByRole('button', { name: /Actualizar/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockActualizarMaterial).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            nombre: 'Material Actualizado'
          })
        );
      });
    });

    test('debe navegar a lista después de guardar', async () => {
      mockCrearMaterial.mockResolvedValue(mockMateriaPrima);

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Llenar formulario con datos válidos
      const codigoInput = screen.getByDisplayValue('1234567890123');
      await userEvent.clear(codigoInput);
      await userEvent.type(codigoInput, '1234567890123');

      const nombreInput = screen.getByDisplayValue('');
      await userEvent.type(nombreInput, 'Material Test');

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/materia-prima');
      }, { timeout: 2000 });
    });

    test('debe llamar onSave callback si se proporciona', async () => {
      const mockOnSave = jest.fn();
      mockCrearMaterial.mockResolvedValue(mockMateriaPrima);

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario onSave={mockOnSave} />
        </BrowserRouter>
      );

      // Llenar formulario con datos válidos
      const codigoInput = screen.getByDisplayValue('1234567890123');
      await userEvent.clear(codigoInput);
      await userEvent.type(codigoInput, '1234567890123');

      const nombreInput = screen.getByDisplayValue('');
      await userEvent.type(nombreInput, 'Material Test');

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockMateriaPrima);
      });
    });
  });

  describe('Manejo de errores', () => {
    test('debe mostrar errores de validación del servidor', async () => {
      mockCrearMaterial.mockRejectedValue(new Error('Error del servidor'));

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Llenar formulario con datos válidos
      const codigoInput = screen.getByDisplayValue('1234567890123');
      await userEvent.clear(codigoInput);
      await userEvent.type(codigoInput, '1234567890123');

      const nombreInput = screen.getByDisplayValue('');
      await userEvent.type(nombreInput, 'Material Test');

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error del servidor/)).toBeInTheDocument();
      });
    });

    test('debe manejar errores específicos de campo', async () => {
      const errorConCampo = {
        response: {
          data: {
            errors: {
              nombre: ['El nombre ya existe']
            }
          }
        }
      };

      require('../../utils/formDataNormalizer').extractValidationErrors.mockReturnValue({
        generalError: null,
        fieldErrors: { nombre: 'El nombre ya existe' }
      });

      mockCrearMaterial.mockRejectedValue(errorConCampo);

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Llenar formulario y enviar
      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('El nombre ya existe')).toBeInTheDocument();
      });
    });
  });

  describe('Edición inline de referencias', () => {
    test('debe editar presentación desde modal', async () => {
      mockActions.editarPresentacion.mockResolvedValue({
        success: true,
        data: { ...mockPresentaciones[0], nombre: 'Presentación Actualizada' }
      });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Abrir modal de edición
      const editPresentacionButton = screen.getByTestId('edit-presentacion');
      await userEvent.click(editPresentacionButton);

      // Guardar cambios en modal
      const saveButton = screen.getByTestId('save-button');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockActions.editarPresentacion).toHaveBeenCalledWith(
          'test-id',
          expect.any(Object)
        );
      });
    });

    test('debe editar categoría desde modal', async () => {
      mockActions.editarCategoria.mockResolvedValue({
        success: true,
        data: { ...mockCategorias[0], nombre: 'Categoría Actualizada' }
      });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      // Abrir modal de edición
      const editCategoriaButton = screen.getByTestId('edit-categoria');
      await userEvent.click(editCategoriaButton);

      // Guardar cambios en modal
      const saveButton = screen.getByTestId('save-button');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockActions.editarCategoria).toHaveBeenCalledWith(
          'test-id',
          expect.any(Object)
        );
      });
    });
  });

  describe('Cancelación', () => {
    test('debe llamar onCancel callback si se proporciona', () => {
      const mockOnCancel = jest.fn();

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario onCancel={mockOnCancel} />
        </BrowserRouter>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('debe navegar a lista si no se proporciona onCancel', () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/materia-prima');
    });
  });

  describe('Estados de carga', () => {
    test('debe mostrar estado de carga al cargar material existente', async () => {
      mockObtenerMaterial.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockMateriaPrima), 1000)));

      mockUseParams.mockReturnValue({ id: '1' });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario materialId="1" />
        </BrowserRouter>
      );

      // Debe mostrar indicador de carga inicial
      expect(screen.getByText(/Cargando/)).toBeInTheDocument();
    });

    test('debe mostrar estado de carga al subir imagen', async () => {
      require('../../services/materiaPrimaService').materiaPrismaService.subirImagen.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          url: 'https://example.com/uploaded-image.jpg'
        }), 1000))
      );

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const fileInput = screen.getByLabelText(/Imagen/i) || screen.getByTestId('file-upload');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      expect(screen.getByText(/Cargando imagen.../)).toBeInTheDocument();
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar datos de material parcialmente definidos', async () => {
      const materialParcial = {
        ...mockMateriaPrima,
        marca: null,
        modelo: null,
        categoria: null,
        proveedor_id: null
      };

      mockObtenerMaterial.mockResolvedValue(materialParcial);
      mockUseParams.mockReturnValue({ id: '1' });

      render(
        <BrowserRouter>
          <MateriaPrimaFormulario materialId="1" />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(materialParcial.nombre)).toBeInTheDocument();
        expect(screen.getByDisplayValue('')).toBeInTheDocument(); // marca y modelo
      });
    });

    test('debe manejar fecha de caducidad vacía', () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const fechaInput = screen.getByDisplayValue('');
      expect(fechaInput).toBeInTheDocument();
    });

    test('debe manejar valores numéricos negativos', () => {
      render(
        <BrowserRouter>
          <MateriaPrimaFormulario />
        </BrowserRouter>
      );

      const stockActualInput = screen.getByDisplayValue('0');
      await userEvent.clear(stockActualInput);
      await userEvent.type(stockActualInput, '-10');

      const submitButton = screen.getByRole('button', { name: /Guardar/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/El stock actual no puede ser negativo/)).toBeInTheDocument();
    });
  });
});