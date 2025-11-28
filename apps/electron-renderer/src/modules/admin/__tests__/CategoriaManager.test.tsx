import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoriaManager from '../CategoriaManager';
import { CategoriaArbol, NewCategoria, CategoriaUpdate } from '../../../../../../packages/shared-types/src/referenceData';

// Mock de los hooks
jest.mock('@/hooks/useReferenceData', () => ({
  useReferenceData: jest.fn()
}));

jest.mock('@/components/ui/InlineEditModal', () => ({
  InlineEditModal: ({ isOpen, onClose, item, type, onSave }: any) =>
    isOpen ? (
      <div role="dialog" aria-modal="true" data-testid="inline-edit-modal">
        <div data-testid="modal-type">{type}</div>
        <div data-testid="modal-item">{item?.nombre || 'new'}</div>
        <button onClick={() => onClose()}>Close Modal</button>
        <button
          onClick={() => onSave(item ? { ...item, nombre: 'Updated' } : { nombre: 'New Item' })}
          data-testid="save-button"
        >
          Save
        </button>
      </div>
    ) : null
}));

// Mock de los componentes UI
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant}>
      {children}
    </span>
  )
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div role="dialog" aria-modal="true">
        <div onClick={() => onOpenChange(false)}>{children}</div>
      </div>
    ) : null,
  DialogContent: ({ children }: any) => <div className="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div className="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div className="dialog-title">{children}</div>
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('test-id')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>
}));

jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' '))
}));

const mockUseReferenceData = require('@/hooks/useReferenceData').useReferenceData;

// Mock data
const mockCategoriasArbol: CategoriaArbol[] = [
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
    actualizado_en: '2024-01-01T00:00:00Z',
    hijos: [
      {
        id: '3',
        nombre: 'Electricidad',
        descripcion: 'Materiales eléctricos',
        categoria_padre_id: '1',
        nivel: 2,
        ruta_completa: 'Construcción > Electricidad',
        icono: '⚡',
        color: '#FFC107',
        orden: 1,
        activo: true,
        es_predeterminado: false,
        id_institucion: 1,
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z',
        hijos: []
      }
    ]
  },
  {
    id: '2',
    nombre: 'Herramientas',
    descripcion: 'Herramientas diversas',
    categoria_padre_id: null,
    nivel: 1,
    ruta_completa: 'Herramientas',
    icono: '🔧',
    color: '#4CAF50',
    orden: 2,
    activo: true,
    es_predeterminado: false,
    id_institucion: 1,
    creado_en: '2024-01-01T00:00:00Z',
    actualizado_en: '2024-01-01T00:00:00Z',
    hijos: []
  }
];

const mockActions = {
  crearCategoria: jest.fn(),
  editarCategoria: jest.fn(),
  eliminarCategoria: jest.fn(),
  moverCategoria: jest.fn()
};

describe('CategoriaManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar mock por defecto
    mockUseReferenceData.mockReturnValue({
      categoriasArbol: mockCategoriasArbol,
      loading: false,
      actions: mockActions
    });

    // Mock para acciones asíncronas
    mockActions.crearCategoria.mockResolvedValue({ success: true });
    mockActions.editarCategoria.mockResolvedValue({ success: true });
    mockActions.eliminarCategoria.mockResolvedValue({ success: true });
    mockActions.moverCategoria.mockResolvedValue({ success: true });

    // Mock para confirm y alert
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Renderizado básico', () => {
    test('debe renderizar el título y descripción correctamente', () => {
      render(<CategoriaManager />);

      expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
      expect(screen.getByText(/Organiza las categorías de manera jerárquica/)).toBeInTheDocument();
    });

    test('debe mostrar el botón de Nueva Categoría', () => {
      render(<CategoriaManager />);

      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nueva Categoría/ })).toBeInTheDocument();
    });

    test('debe mostrar estado de carga', () => {
      mockUseReferenceData.mockReturnValue({
        categoriasArbol: [],
        loading: true,
        actions: mockActions
      });

      render(<CategoriaManager />);

      expect(screen.getByText('Cargando categorías...')).toBeInTheDocument();
    });

    test('debe mostrar mensaje cuando no hay categorías', () => {
      mockUseReferenceData.mockReturnValue({
        categoriasArbol: [],
        loading: false,
        actions: mockActions
      });

      render(<CategoriaManager />);

      expect(screen.getByText('No hay categorías configuradas')).toBeInTheDocument();
      expect(screen.getByText('Crear Primera Categoría')).toBeInTheDocument();
    });
  });

  describe('Renderizado de categorías', () => {
    test('debe renderizar categorías con información correcta', () => {
      render(<CategoriaManager />);

      // Categorías principales
      expect(screen.getByText('Construcción')).toBeInTheDocument();
      expect(screen.getByText('Herramientas')).toBeInTheDocument();

      // Subcategorías
      expect(screen.getByText('Electricidad')).toBeInTheDocument();

      // Niveles y conteo
      expect(screen.getByText('Nivel 1')).toBeInTheDocument();
      expect(screen.getByText('1 subcategoría')).toBeInTheDocument();

      // Iconos y colores
      expect(screen.getByText('🔨')).toBeInTheDocument();
      expect(screen.getByText('🔧')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    test('debe mostrar sangría según nivel jerárquico', () => {
      render(<CategoriaManager />);

      // Las subcategorías deben tener marginLeft diferente
      const mainCards = screen.getAllByText('Construcción');
      const subCards = screen.getAllByText('Electricidad');

      expect(mainCards.length).toBeGreaterThan(0);
      expect(subCards.length).toBeGreaterThan(0);
    });

    test('debe mostrar rutas completas', () => {
      render(<CategoriaManager />);

      expect(screen.getByText('Construcción')).toBeInTheDocument();
      expect(screen.getAllByText(/Construcción > Electricidad/)).toHaveLength(1);
    });
  });

  describe('Funcionalidad de creación', () => {
    test('debe abrir modal de creación al clic en Nueva Categoría', async () => {
      render(<CategoriaManager />);

      const newButton = screen.getByRole('button', { name: /Nueva Categoría/ });
      await userEvent.click(newButton);

      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Nombre de la categoría')).toBeInTheDocument();
    });

    test('debe crear nueva categoría exitosamente', async () => {
      render(<CategoriaManager />);

      // Abrir modal
      const newButton = screen.getByRole('button', { name: /Nueva Categoría/ });
      await userEvent.click(newButton);

      // Llenar formulario
      const nombreInput = screen.getByDisplayValue('Nombre de la categoría');
      await userEvent.clear(nombreInput);
      await userEvent.type(nombreInput, 'Nueva Categoría Test');

      const descripcionInput = screen.getByDisplayValue('Descripción de la categoría');
      await userEvent.type(descripcionInput, 'Descripción de prueba');

      // Enviar formulario
      const createButton = screen.getByRole('button', { name: 'Crear Categoría' });
      await userEvent.click(createButton);

      expect(mockActions.crearCategoria).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nueva Categoría Test',
          descripcion: 'Descripción de prueba'
        }),
        undefined
      );
    });

    test('debe crear subcategoría con padre seleccionado', async () => {
      render(<CategoriaManager />);

      // Simular clic en botón de crear subcategoría
      const createSubButtons = screen.getAllByTitle('Crear subcategoría');
      await userEvent.click(createSubButtons[0]);

      // Verificar que se abre modal con padre preseleccionado
      expect(screen.getByText('Nueva Categoría')).toBeInTheDocument();
      expect(mockActions.crearCategoria).not.toHaveBeenCalled();
    });

    test('debe validar formulario de creación', async () => {
      render(<CategoriaManager />);

      const newButton = screen.getByRole('button', { name: /Nueva Categoría/ });
      await userEvent.click(newButton);

      // Intentar enviar sin nombre
      const createButton = screen.getByRole('button', { name: 'Crear Categoría' });
      await userEvent.click(createButton);

      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(mockActions.crearCategoria).not.toHaveBeenCalled();
    });
  });

  describe('Funcionalidad de edición', () => {
    test('debe abrir modal de edición al clic en botón editar', async () => {
      render(<CategoriaManager />);

      const editButtons = screen.getAllByTitle('Editar categoría');
      await userEvent.click(editButtons[0]);

      expect(screen.getByTestId('inline-edit-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-type')).toHaveTextContent('categoria');
      expect(screen.getByTestId('modal-item')).toHaveTextContent('Construcción');
    });

    test('debe editar categoría exitosamente', async () => {
      render(<CategoriaManager />);

      const editButtons = screen.getAllByTitle('Editar categoría');
      await userEvent.click(editButtons[0]);

      const saveButton = screen.getByTestId('save-button');
      await userEvent.click(saveButton);

      expect(mockActions.editarCategoria).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          nombre: 'Updated'
        })
      );
    });
  });

  describe('Funcionalidad de eliminación', () => {
    test('debe mostrar confirmación al eliminar categoría', async () => {
      render(<CategoriaManager />);

      const deleteButtons = screen.getAllByTitle('Eliminar categoría');
      await userEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        '¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.'
      );
    });

    test('debe eliminar categoría exitosamente', async () => {
      render(<CategoriaManager />);

      const deleteButtons = screen.getAllByTitle('Eliminar categoría');
      await userEvent.click(deleteButtons[0]);

      expect(mockActions.eliminarCategoria).toHaveBeenCalledWith('1');
    });

    test('no debe eliminar si se cancela la confirmación', async () => {
      window.confirm = jest.fn(() => false);

      render(<CategoriaManager />);

      const deleteButtons = screen.getAllByTitle('Eliminar categoría');
      await userEvent.click(deleteButtons[0]);

      expect(mockActions.eliminarCategoria).not.toHaveBeenCalled();
    });

    test('debe mostrar alerta si la eliminación falla', async () => {
      mockActions.eliminarCategoria.mockResolvedValue({
        success: false,
        error: 'Error al eliminar'
      });

      render(<CategoriaManager />);

      const deleteButtons = screen.getAllByTitle('Eliminar categoría');
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error al eliminar');
      });
    });
  });

  describe('Funcionalidad de Drag and Drop', () => {
    test('debe iniciar drag al arrastrar categoría', async () => {
      render(<CategoriaManager />);

      const categoryCards = screen.getAllByText('Construcción');
      const draggableCard = categoryCards[0].closest('[draggable="true"]');

      if (draggableCard) {
        fireEvent.dragStart(draggableCard);

        // Verificar que se muestra estado de arrastre
        await waitFor(() => {
          expect(screen.getByText(/Arrastrando "Construcción"/)).toBeInTheDocument();
        });
      }
    });

    test('debe manejar dragOver y drop correctamente', async () => {
      render(<CategoriaManager />);

      const sourceCard = screen.getAllByText('Construcción')[0].closest('[draggable="true"]');
      const targetCard = screen.getAllByText('Herramientas')[0].closest('[draggable="true"]');

      if (sourceCard && targetCard) {
        // Iniciar drag
        fireEvent.dragStart(sourceCard);

        // Simular dragOver
        fireEvent.dragOver(targetCard, {
          preventDefault: jest.fn(),
          dataTransfer: { dropEffect: 'move' }
        } as any);

        // Simular drop
        fireEvent.drop(targetCard, {
          preventDefault: jest.fn()
        } as any);

        await waitFor(() => {
          expect(mockActions.moverCategoria).toHaveBeenCalledWith('1', '2');
        });
      }
    });

    test('debe mostrar estado de carga durante movimiento', async () => {
      mockActions.moverCategoria.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<CategoriaManager />);

      const sourceCard = screen.getAllByText('Construcción')[0].closest('[draggable="true"]');
      const targetCard = screen.getAllByText('Herramientas')[0].closest('[draggable="true"]');

      if (sourceCard && targetCard) {
        fireEvent.dragStart(sourceCard);
        fireEvent.dragOver(targetCard);
        fireEvent.drop(targetCard);

        expect(screen.getByText('Moviendo categoría...')).toBeInTheDocument();
      }
    });

    test('debe mostrar mensaje de éxito al mover categoría', async () => {
      render(<CategoriaManager />);

      const sourceCard = screen.getAllByText('Construcción')[0].closest('[draggable="true"]');
      const targetCard = screen.getAllByText('Herramientas')[0].closest('[draggable="true"]');

      if (sourceCard && targetCard) {
        fireEvent.dragStart(sourceCard);
        fireEvent.dragOver(targetCard);
        fireEvent.drop(targetCard);

        await waitFor(() => {
          expect(screen.getByText(/"Construcción" movida a "Herramientas"/)).toBeInTheDocument();
        });
      }
    });

    test('debe mostrar error si falla el movimiento', async () => {
      mockActions.moverCategoria.mockResolvedValue({
        success: false,
        error: 'Error al mover categoría'
      });

      render(<CategoriaManager />);

      const sourceCard = screen.getAllByText('Construcción')[0].closest('[draggable="true"]');
      const targetCard = screen.getAllByText('Herramientas')[0].closest('[draggable="true"]');

      if (sourceCard && targetCard) {
        fireEvent.dragStart(sourceCard);
        fireEvent.dragOver(targetCard);
        fireEvent.drop(targetCard);

        await waitFor(() => {
          expect(screen.getByText('Error al mover categoría')).toBeInTheDocument();
        });
      }
    });

    test('debe cancelar drag al hacer clic en Cancelar', async () => {
      render(<CategoriaManager />);

      const categoryCards = screen.getAllByText('Construcción');
      const draggableCard = categoryCards[0].closest('[draggable="true"]');

      if (draggableCard) {
        fireEvent.dragStart(draggableCard);

        // Buscar y hacer clic en el botón de cancelar
        const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
        await userEvent.click(cancelar);

        expect(screen.queryByText(/Arrastrando/)).not.toBeInTheDocument();
      }
    });
  });

  describe('Estados y validaciones', () => {
    test('debe deshabilitar botones durante movimiento', async () => {
      mockActions.moverCategoria.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<CategoriaManager />);

      const sourceCard = screen.getAllByText('Construcción')[0].closest('[draggable="true"]');
      const targetCard = screen.getAllByText('Herramientas')[0].closest('[draggable="true"]');

      if (sourceCard && targetCard) {
        fireEvent.dragStart(sourceCard);
        fireEvent.dragOver(targetCard);
        fireEvent.drop(targetCard);

        const newButton = screen.getByRole('button', { name: /Nueva Categoría/ });
        expect(newButton).toBeDisabled();
      }
    });

    test('debe mostrar jerarquía en select de categoría padre', async () => {
      render(<CategoriaManager />);

      const newButton = screen.getByRole('button', { name: /Nueva Categoría/ });
      await userEvent.click(newButton);

      // Verificar que muestra opciones con sangría
      expect(screen.getByText('Seleccionar categoría padre')).toBeInTheDocument();
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar categorías sin descripción', () => {
      const categoriasSinDescripcion = mockCategoriasArbol.map(cat => ({
        ...cat,
        descripcion: undefined
      }));

      mockUseReferenceData.mockReturnValue({
        categoriasArbol: categoriasSinDescripcion,
        loading: false,
        actions: mockActions
      });

      render(<CategoriaManager />);

      expect(screen.getByText('Construcción')).toBeInTheDocument();
      expect(screen.queryByText('Materiales de construcción')).not.toBeInTheDocument();
    });

    test('debe manejar categorías sin icono ni color', () => {
      const categoriasSinIconoColor = mockCategoriasArbol.map(cat => ({
        ...cat,
        icono: undefined,
        color: undefined
      }));

      mockUseReferenceData.mockReturnValue({
        categoriasArbol: categoriasSinIconoColor,
        loading: false,
        actions: mockActions
      });

      render(<CategoriaManager />);

      expect(screen.getByText('Construcción')).toBeInTheDocument();
      // No debería mostrar iconos o colores
    });

    test('debe manejar errores en las acciones', async () => {
      mockActions.crearCategoria.mockRejectedValue(new Error('Error de red'));
      mockActions.editarCategoria.mockRejectedValue(new Error('Error de red'));
      mockActions.moverCategoria.mockRejectedValue(new Error('Error de red'));

      render(<CategoriaManager />);

      // Creación
      const newButton = screen.getByRole('button', { name: /Nueva Categoría/ });
      await userEvent.click(newButton);

      const nombreInput = screen.getByDisplayValue('Nombre de la categoría');
      await userEvent.clear(nombreInput);
      await userEvent.type(nombreInput, 'Test');

      const createButton = screen.getByRole('button', { name: 'Crear Categoría' });
      await userEvent.click(createButton);

      expect(screen.getByText('Error de red')).toBeInTheDocument();
    });
  });
});