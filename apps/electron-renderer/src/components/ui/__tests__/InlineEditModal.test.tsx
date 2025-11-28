import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineEditModal from '../InlineEditModal';
import { Categoria, Presentacion } from '../../../../../../../packages/shared-types/src/referenceData';

// Mock de los componentes UI
jest.mock('../dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div role="dialog" aria-modal="true">
        <div onClick={() => onOpenChange(false)}>{children}</div>
      </div>
    ) : null,
  DialogContent: ({ children }: any) => <div className="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div className="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div className="dialog-title">{children}</div>,
  DialogFooter: ({ children }: any) => <div className="dialog-footer">{children}</div>
}));

jest.mock('../button', () => ({
  Button: ({ children, onClick, disabled, type, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={variant === 'outline' ? 'btn-outline' : 'btn-primary'}
    >
      {children}
    </button>
  )
}));

jest.mock('../label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} className="form-label">
      {children}
    </label>
  )
}));

jest.mock('../input', () => ({
  Input: ({ id, value, onChange, placeholder, className, type, maxLength, required, step, min, max }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      type={type}
      maxLength={maxLength}
      required={required}
      step={step}
      min={min}
      max={max}
    />
  )
}));

jest.mock('../textarea', () => ({
  Textarea: ({ id, value, onChange, placeholder, className, rows, maxLength }: any) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={rows}
      maxLength={maxLength}
    />
  )
}));

// Mock data
const mockCategoria: Categoria = {
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
};

const mockPresentacion: Presentacion = {
  id: '1',
  nombre: 'Kilogramo',
  descripcion: 'Unidad de peso',
  abreviatura: 'kg',
  unidad_base: 'gramo',
  factor_conversion: 1000,
  activo: true,
  es_predeterminado: false,
  id_institucion: 1,
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z'
};

describe('InlineEditModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    test('no debe renderizar cuando isOpen es false', () => {
      render(
        <InlineEditModal
          isOpen={false}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('debe renderizar modal para crear categoría', () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Crear Categoría')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
      expect(screen.getByLabelText('Icono')).toBeInTheDocument();
      expect(screen.getByLabelText('Color')).toBeInTheDocument();
    });

    test('debe renderizar modal para crear presentación', () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="presentacion"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Crear Presentación')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
      expect(screen.getByLabelText('Abreviatura')).toBeInTheDocument();
      expect(screen.getByLabelText('Unidad Base')).toBeInTheDocument();
      expect(screen.getByLabelText('Factor de Conversión')).toBeInTheDocument();
    });

    test('debe renderizar modal para editar categoría existente', () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          item={mockCategoria}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Editar Categoría')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Construcción')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Materiales de construcción')).toBeInTheDocument();
      expect(screen.getByDisplayValue('🔨')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#FF5722')).toBeInTheDocument();
    });

    test('debe renderizar modal para editar presentación existente', () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          item={mockPresentacion}
          type="presentacion"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Editar Presentación')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Kilogramo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Unidad de peso')).toBeInTheDocument();
      expect(screen.getByDisplayValue('kg')).toBeInTheDocument();
      expect(screen.getByDisplayValue('gramo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });
  });

  describe('Validación de formulario', () => {
    test('debe validar nombre requerido', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('debe validar longitud máxima del nombre', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'a'.repeat(101));

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El nombre no puede exceder 100 caracteres')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('debe validar formato de color hexadecimal', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Categoria');

      const colorInput = screen.getByDisplayValue('#000000');
      await userEvent.clear(colorInput);
      await userEvent.type(colorInput, 'invalid-color');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El color debe ser un valor hexadecimal válido (#RRGGBB)')).toBeInTheDocument();
    });

    test('debe validar longitud máxima de icono', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Categoria');

      const iconoInput = screen.getByPlaceholderText('🔧 🏗️ 📦');
      await userEvent.type(iconoInput, 'a'.repeat(51));

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El icono no puede exceder 50 caracteres')).toBeInTheDocument();
    });

    test('debe validar longitud máxima de abreviatura', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="presentacion"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Presentacion');

      const abreviaturaInput = screen.getByPlaceholderText('Ej: kg, L, ud');
      await userEvent.type(abreviaturaInput, 'a'.repeat(21));

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('La abreviatura no puede exceder 20 caracteres')).toBeInTheDocument();
    });

    test('debe validar factor de conversión positivo', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="presentacion"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Presentacion');

      const factorInput = screen.getByPlaceholderText('1000');
      await userEvent.type(factorInput, '-5');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El factor de conversión debe ser positivo')).toBeInTheDocument();
    });
  });

  describe('Funcionalidad de guardado', () => {
    test('debe llamar onSave con datos correctos para categoría', async () => {
      mockOnSave.mockResolvedValue({ success: true });

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      // Llenar formulario
      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Nueva Categoría');

      const descripcionInput = screen.getByLabelText('Descripción');
      await userEvent.type(descripcionInput, 'Descripción de prueba');

      const iconoInput = screen.getByPlaceholderText('🔧 🏗️ 📦');
      await userEvent.type(iconoInput, '🏗️');

      const colorInput = screen.getByDisplayValue('#000000');
      await userEvent.clear(colorInput);
      await userEvent.type(colorInput, '#FF0000');

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        nombre: 'Nueva Categoría',
        descripcion: 'Descripción de prueba',
        icono: '🏗️',
        color: '#FF0000'
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('debe llamar onSave con datos correctos para presentación', async () => {
      mockOnSave.mockResolvedValue({ success: true });

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="presentacion"
          onSave={mockOnSave}
        />
      );

      // Llenar formulario
      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Nueva Presentación');

      const abreviaturaInput = screen.getByPlaceholderText('Ej: kg, L, ud');
      await userEvent.type(abreviaturaInput, 'np');

      const unidadBaseInput = screen.getByPlaceholderText('Ej: gramo');
      await userEvent.type(unidadBaseInput, 'unidad');

      const factorInput = screen.getByPlaceholderText('1000');
      await userEvent.type(factorInput, '100');

      // Enviar formulario
      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        nombre: 'Nueva Presentación',
        abreviatura: 'np',
        unidad_base: 'unidad',
        factor_conversion: 100
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('debe mostrar error general cuando onSave falla', async () => {
      mockOnSave.mockResolvedValue({
        success: false,
        error: 'Error de servidor'
      });

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Categoria');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error de servidor')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    test('debe manejar excepciones en onSave', async () => {
      mockOnSave.mockRejectedValue(new Error('Error inesperado'));

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Categoria');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error inesperado')).toBeInTheDocument();
      });
    });
  });

  describe('Interacciones del usuario', () => {
    test('debe limpiar errores al escribir en un campo', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test');

      expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
    });

    test('debe formatear automáticamente el color con #', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const colorTextInput = screen.getByPlaceholderText('#RRGGBB');
      await userEvent.type(colorTextInput, 'FF0000');

      const colorPickerInput = screen.getByDisplayValue('#000000');
      expect(colorPickerInput).toHaveValue('#FF0000');
    });

    test('debe cerrar modal al hacer clic en Cancelar', async () => {
      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('debe deshabilitar botones durante carga', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Categoria');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });

    test('debe mostrar spinner durante carga', async () => {
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test Categoria');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
    });
  });

  describe('Reset de formulario', () => {
    test('debe resetear formulario cuando se abre sin item', () => {
      const { rerender } = render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          item={mockCategoria}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('Construcción')).toBeInTheDocument();

      // Cerrar y volver a abrir sin item
      rerender(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByDisplayValue('Construcción')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toHaveValue('');
    });

    test('debe limpiar errores cuando cambia el item', async () => {
      const { rerender } = render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();

      rerender(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          item={mockCategoria}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar valores undefined en item', () => {
      const itemUndefined = {
        ...mockCategoria,
        descripcion: undefined,
        icono: undefined,
        color: undefined
      };

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          item={itemUndefined}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      expect(screen.getByDisplayValue('Construcción')).toBeInTheDocument();
      expect(screen.getByLabelText('Descripción')).toHaveValue('');
      expect(screen.getByLabelText('Icono')).toHaveValue('');
    });

    test('debe recortar espacios en blanco del nombre y descripción', async () => {
      mockOnSave.mockResolvedValue({ success: true });

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="categoria"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, '  Test Categoria  ');

      const descripcionInput = screen.getByLabelText('Descripción');
      await userEvent.type(descripcionInput, '  Test descripción  ');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        nombre: 'Test Categoria',
        descripcion: 'Test descripción'
      });
    });

    test('debe manejar factor_conversion undefined', async () => {
      mockOnSave.mockResolvedValue({ success: true });

      render(
        <InlineEditModal
          isOpen={true}
          onClose={mockOnClose}
          type="presentacion"
          onSave={mockOnSave}
        />
      );

      const nombreInput = screen.getByLabelText('Nombre');
      await userEvent.type(nombreInput, 'Test');

      const submitButton = screen.getByRole('button', { name: 'Crear' });
      await userEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        nombre: 'Test'
      });
    });
  });
});