import { renderHook, act, waitFor } from '@testing-library/react';
import { useReferenceData } from '../useReferenceData';
import { Categoria, Presentacion, NewCategoria, NewPresentacion, CategoriaUpdate, PresentacionUpdate } from '../../../../../../../packages/shared-types/src/referenceData';

// Mock de window.electronAPI
const mockElectronAPI = {
  categoria: {
    listar: jest.fn(),
    listarArbol: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
    mover: jest.fn()
  },
  presentacion: {
    listar: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn()
  }
};

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
    actualizado_en: '2024-01-01T00:00:00Z'
  }
];

const mockCategoriasArbol = [
  {
    ...mockCategorias[0],
    hijos: [mockCategorias[1]]
  }
];

const mockPresentaciones: Presentacion[] = [
  {
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
  },
  {
    id: '2',
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
  }
];

describe('useReferenceData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Asignar mock a window
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true
    });

    // Configurar respuestas por defecto
    mockElectronAPI.categoria.listar.mockResolvedValue({
      success: true,
      data: mockCategorias
    });
    mockElectronAPI.categoria.listarArbol.mockResolvedValue({
      success: true,
      data: mockCategoriasArbol
    });
    mockElectronAPI.presentacion.listar.mockResolvedValue({
      success: true,
      data: mockPresentaciones
    });
    mockElectronAPI.categoria.crear.mockResolvedValue({
      success: true,
      data: mockCategorias[0]
    });
    mockElectronAPI.presentacion.crear.mockResolvedValue({
      success: true,
      data: mockPresentaciones[0]
    });
    mockElectronAPI.categoria.editar.mockResolvedValue({
      success: true,
      data: mockCategorias[0]
    });
    mockElectronAPI.presentacion.editar.mockResolvedValue({
      success: true,
      data: mockPresentaciones[0]
    });
    mockElectronAPI.categoria.eliminar.mockResolvedValue({
      success: true
    });
    mockElectronAPI.presentacion.eliminar.mockResolvedValue({
      success: true
    });
    mockElectronAPI.categoria.mover.mockResolvedValue({
      success: true,
      data: mockCategorias[0]
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Carga inicial', () => {
    test('debe cargar datos automáticamente cuando autoLoad es true', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      expect(result.current.loading).toBe(true);
      expect(result.current.initialized).toBe(false);

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.initialized).toBe(true);
      });

      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(1, true);
      expect(mockElectronAPI.categoria.listarArbol).toHaveBeenCalledWith(1);
      expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(1, true);

      expect(result.current.categorias).toEqual(mockCategorias);
      expect(result.current.categoriasArbol).toEqual(mockCategoriasArbol);
      expect(result.current.presentaciones).toEqual(mockPresentaciones);
    });

    test('no debe cargar datos automáticamente cuando autoLoad es false', () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: false
      }));

      expect(result.current.loading).toBe(false);
      expect(result.current.initialized).toBe(false);
      expect(mockElectronAPI.categoria.listar).not.toHaveBeenCalled();
    });

    test('debe manejar errores en la carga inicial', async () => {
      const errorMessage = 'Error de conexión';
      mockElectronAPI.categoria.listar.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });

      expect(result.current.categorias).toEqual([]);
      expect(result.current.presentaciones).toEqual([]);
    });

    test('debe manejar respuestas fallidas de la API', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue({
        success: false,
        error: 'Error del servidor'
      });

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categorias).toEqual([]);
    });
  });

  describe('CRUD de Categorías', () => {
    test('debe crear categoría con optimistic update', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: false
      }));

      const nuevaCategoria: NewCategoria = {
        nombre: 'Nueva Categoría',
        descripcion: 'Descripción',
        icono: '🏗️',
        color: '#00FF00',
        orden: 1,
        id_institucion: 1
      };

      act(() => {
        result.current.actions.crearCategoria(nuevaCategoria);
      });

      // Verificar optimistic update
      expect(result.current.categorias.length).toBe(1);
      const tempCategoria = result.current.categorias[0];
      expect(tempCategoria.nombre).toBe(nuevaCategoria.nombre);
      expect(tempCategoria.id).toMatch(/^temp-\d+$/);

      // Esperar a que se complete la creación
      await waitFor(() => {
        expect(mockElectronAPI.categoria.crear).toHaveBeenCalledWith(nuevaCategoria, undefined);
      });
    });

    test('debe crear subcategoría con padre', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const nuevaCategoria: NewCategoria = {
        nombre: 'Subcategoría',
        id_institucion: 1
      };

      act(() => {
        result.current.actions.crearCategoria(nuevaCategoria, '1');
      });

      await waitFor(() => {
        expect(mockElectronAPI.categoria.crear).toHaveBeenCalledWith(nuevaCategoria, '1');
      });
    });

    test('debe manejar error en creación de categoría', async () => {
      mockElectronAPI.categoria.crear.mockResolvedValue({
        success: false,
        error: 'Error al crear categoría'
      });

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: false
      }));

      const nuevaCategoria: NewCategoria = {
        nombre: 'Nueva Categoría',
        id_institucion: 1
      };

      let resultado;
      await act(async () => {
        resultado = await result.current.actions.crearCategoria(nuevaCategoria);
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Error al crear categoría');
    });

    test('debe mover categoría', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.actions.moverCategoria('1', '2');
      });

      await waitFor(() => {
        expect(mockElectronAPI.categoria.mover).toHaveBeenCalledWith('1', '2');
      });
    });

    test('debe editar categoría', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const cambios: CategoriaUpdate = {
        nombre: 'Categoría Actualizada'
      };

      act(() => {
        result.current.actions.editarCategoria('1', cambios);
      });

      await waitFor(() => {
        expect(mockElectronAPI.categoria.editar).toHaveBeenCalledWith('1', cambios);
      });
    });

    test('debe actualizar localmente al editar categoría', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const cambios: CategoriaUpdate = {
        nombre: 'Categoría Actualizada'
      };

      act(() => {
        result.current.actions.editarCategoria('1', cambios);
      });

      // El estado local debe actualizarse inmediatamente
      const categoriaActualizada = result.current.categorias.find(c => c.id === '1');
      expect(categoriaActualizada?.nombre).toBe('Categoría Actualizada');
    });

    test('debe eliminar categoría', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.actions.eliminarCategoria('1');
      });

      await waitFor(() => {
        expect(mockElectronAPI.categoria.eliminar).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('CRUD de Presentaciones', () => {
    test('debe crear presentación con optimistic update', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: false
      }));

      const nuevaPresentacion: NewPresentacion = {
        nombre: 'Nueva Presentación',
        abreviatura: 'np',
        id_institucion: 1
      };

      act(() => {
        result.current.actions.crearPresentacion(nuevaPresentacion);
      });

      // Verificar optimistic update
      expect(result.current.presentaciones.length).toBe(1);
      const tempPresentacion = result.current.presentaciones[0];
      expect(tempPresentacion.nombre).toBe(nuevaPresentacion.nombre);
      expect(tempPresentacion.id).toMatch(/^temp-\d+$/);

      await waitFor(() => {
        expect(mockElectronAPI.presentacion.crear).toHaveBeenCalledWith(nuevaPresentacion);
      });
    });

    test('debe editar presentación', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const cambios: PresentacionUpdate = {
        nombre: 'Presentación Actualizada'
      };

      act(() => {
        result.current.actions.editarPresentacion('1', cambios);
      });

      await waitFor(() => {
        expect(mockElectronAPI.presentacion.editar).toHaveBeenCalledWith('1', cambios);
      });
    });

    test('debe actualizar localmente al editar presentación', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const cambios: PresentacionUpdate = {
        nombre: 'Presentación Actualizada'
      };

      act(() => {
        result.current.actions.editarPresentacion('1', cambios);
      });

      // El estado local debe actualizarse inmediatamente
      const presentacionActualizada = result.current.presentaciones.find(p => p.id === '1');
      expect(presentacionActualizada?.nombre).toBe('Presentación Actualizada');
    });

    test('debe eliminar presentación', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      act(() => {
        result.current.actions.eliminarPresentacion('1');
      });

      // La eliminación debe ser inmediata
      expect(result.current.presentaciones.filter(p => p.id === '1').length).toBe(0);

      await waitFor(() => {
        expect(mockElectronAPI.presentacion.eliminar).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Funciones helper', () => {
    test('getNivelCategoria debe retornar nivel correcto', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.actions.getNivelCategoria('1')).toBe(1);
      expect(result.current.actions.getNivelCategoria('2')).toBe(2);
      expect(result.current.actions.getNivelCategoria('inexistente')).toBe(1);
    });

    test('getCategoriasFlat debe aplanar jerarquía', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      const flatCategorias = result.current.actions.getCategoriasFlat(mockCategoriasArbol);
      expect(flatCategorias.length).toBe(2);
      expect(flatCategorias[0].id).toBe('1');
      expect(flatCategorias[1].id).toBe('2');
    });

    test('refrescar debe recargar todos los datos', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      // Limpiar mocks para verificar que se llaman de nuevo
      jest.clearAllMocks();

      act(() => {
        result.current.actions.refrescar();
      });

      await waitFor(() => {
        expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(1, true);
        expect(mockElectronAPI.categoria.listarArbol).toHaveBeenCalledWith(1);
        expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(1, true);
      });
    });
  });

  describe('Opciones memorizadas', () => {
    test('categoriasOptions debe construir opciones agrupadas', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.categoriasOptions).toBeDefined();
      expect(Array.isArray(result.current.categoriasOptions)).toBe(true);
    });

    test('presentacionesOptions debe construir opciones con abreviaturas', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.presentacionesOptions).toBeDefined();
      expect(result.current.presentacionesOptions[0].label).toBe('Kilogramo (kg)');
      expect(result.current.presentacionesOptions[1].label).toBe('Unidad (ud)');
    });

    test('presentacionesOptions debe incluir términos de búsqueda', async () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.presentacionesOptions[0].searchTerms).toBe('kilogramo kg unidad de peso');
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar excepciones en crear categoría', async () => {
      mockElectronAPI.categoria.crear.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: false
      }));

      const nuevaCategoria: NewCategoria = {
        nombre: 'Test',
        id_institucion: 1
      };

      let resultado;
      await act(async () => {
        resultado = await result.current.actions.crearCategoria(nuevaCategoria);
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Error de red');
    });

    test('debe manejar excepciones en mover categoría', async () => {
      mockElectronAPI.categoria.mover.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      let resultado;
      await act(async () => {
        resultado = await result.current.actions.moverCategoria('1', '2');
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Error de red');
    });

    test('debe manejar excepciones en eliminar presentación', async () => {
      mockElectronAPI.presentacion.eliminar.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      let resultado;
      await act(async () => {
        resultado = await result.current.actions.eliminarPresentacion('1');
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Error de red');
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar idInstitucion inválido', () => {
      renderHook(() => useReferenceData({
        idInstitucion: NaN,
        autoLoad: false
      }));

      // No debería lanzar error
    });

    test('debe manejar arrays vacíos en buildGroupedOptions', () => {
      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: false
      }));

      // Forzar categorías vacías
      act(() => {
        // El hook debería manejar arrays vacíos sin errores
      });

      expect(result.current.categoriasOptions).toBeDefined();
    });

    test('debe manejar categorías sin hijos', async () => {
      mockElectronAPI.categoria.listarArbol.mockResolvedValue({
        success: true,
        data: mockCategorias
      });

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.categoriasArbol).toEqual(mockCategorias);
    });

    test('debe manejar presentaciones sin abreviatura ni descripción', async () => {
      const presentacionesSinAbreviatura = mockPresentaciones.map(p => ({
        ...p,
        abreviatura: undefined,
        descripcion: undefined
      }));

      mockElectronAPI.presentacion.listar.mockResolvedValue({
        success: true,
        data: presentacionesSinAbreviatura
      });

      const { result } = renderHook(() => useReferenceData({
        idInstitucion: 1,
        autoLoad: true
      }));

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.presentacionesOptions[0].label).toBe('Kilogramo');
      expect(result.current.presentacionesOptions[0].searchTerms).toBe('kilogramo');
    });
  });
});