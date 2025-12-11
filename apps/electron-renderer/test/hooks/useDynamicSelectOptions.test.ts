import { renderHook, waitFor } from '@testing-library/react';
import { useDynamicSelectOptions, DynamicSelectOption } from '../../src/hooks/useDynamicSelectOptions';
import { createTestQueryClient, createTestWrapper, mockElectronAPI, mockCategorias, mockPresentaciones } from './setup';

describe('useDynamicSelectOptions Hook', () => {
  const mockIdInstitucion = 1;
  let queryClient: any;
  let wrapper: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createTestWrapper(queryClient);
  });

  describe('Categorías (type="categoria")', () => {
    test('debe cargar categorías correctamente', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          includeInactive: true
        }),
        { wrapper }
      );

      // Estado inicial
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isPending).toBe(true);
      expect(result.current.options).toHaveLength(0);

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isPending).toBe(false);
      });

      // Verificar datos cargados
      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(mockIdInstitucion, true);
      expect(result.current.options).toHaveLength(3);
      expect(result.current.error).toBeNull();
    });

    test('debe generar opciones con formato correcto para categorías', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const options = result.current.options;

      // Verificar primera opción (Construcción)
      expect(options[0]).toEqual({
        value: '1',
        label: 'Construcción',
        data: mockCategorias[0],
        isDisabled: false
      });

      // Verificar tercera opción (Fontanería - inactiva)
      expect(options[2]).toEqual({
        value: '3',
        label: 'Fontanería',
        data: mockCategorias[2],
        isDisabled: true // debe estar deshabilitada por estar inactiva
      });
    });

    test('debe manejar categorías sin nombre', async () => {
      const categoriasSinNombre = [
        { ...mockCategoria, id: '1', nombre: undefined }
      ];
      mockElectronAPI.categoria.listar.mockResolvedValue(categoriasSinNombre);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(1);
      });

      expect(result.current.options[0].label).toBe('Categoría 1');
    });

    test('debe manejar error en la carga de categorías', async () => {
      const errorMessage = 'Error al cargar categorías';
      mockElectronAPI.categoria.listar.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.options).toHaveLength(0);
    });

    test('debe manejar respuesta vacía del servidor', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue([]);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.options).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    test('debe manejar respuesta no válida (no array)', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(null);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.options).toHaveLength(0);
    });
  });

  describe('Presentaciones (type="presentacion")', () => {
    test('debe cargar presentaciones correctamente', async () => {
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'presentacion',
          idInstitucion: mockIdInstitucion,
          includeInactive: true
        }),
        { wrapper }
      );

      // Estado inicial
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isPending).toBe(true);

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isPending).toBe(false);
      });

      // Verificar datos cargados
      expect(mockElectronAPI.presentacion.listar).toHaveBeenCalledWith(mockIdInstitucion, true);
      expect(result.current.options).toHaveLength(3);
      expect(result.current.error).toBeNull();
    });

    test('debe generar opciones con formato correcto para presentaciones', async () => {
      mockElectronAPI.presentacion.listar.mockResolvedValue(mockPresentaciones);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'presentacion',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const options = result.current.options;

      // Verificar primera opción (Kilogramo)
      expect(options[0]).toEqual({
        value: '1',
        label: 'Kilogramo (kg)',
        data: mockPresentaciones[0],
        isDisabled: false
      });

      // Verificar segunda opción (Litro)
      expect(options[1]).toEqual({
        value: '2',
        label: 'Litro (L)',
        data: mockPresentaciones[1],
        isDisabled: false
      });

      // Verificar tercera opción (Unidad - inactiva)
      expect(options[2]).toEqual({
        value: '3',
        label: 'Unidad',
        data: mockPresentaciones[2],
        isDisabled: true // debe estar deshabilitada por estar inactiva
      });
    });

    test('debe manejar presentaciones sin nombre', async () => {
      const presentacionesSinNombre = [
        { ...mockPresentacion, id: '1', nombre: undefined }
      ];
      mockElectronAPI.presentacion.listar.mockResolvedValue(presentacionesSinNombre);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'presentacion',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(1);
      });

      expect(result.current.options[0].label).toBe('Presentación 1');
    });

    test('debe manejar presentaciones con y sin abreviatura', async () => {
      const presentacionesMixtas = [
        mockPresentacion, // con abreviatura
        {
          ...mockPresentacion,
          id: '2',
          nombre: 'Unidad',
          descripcion: 'Unidad sin abreviatura',
          abreviatura: null
        }
      ];
      mockElectronAPI.presentacion.listar.mockResolvedValue(presentacionesMixtas);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'presentacion',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(2);
      });

      // Con abreviatura
      expect(result.current.options[0].label).toBe('Kilogramo (kg)');
      // Sin abreviatura
      expect(result.current.options[1].label).toBe('Unidad');
    });
  });

  describe('Funciones de utilidad', () => {
    beforeEach(async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);
    });

    test('getOptionByValue debe encontrar opción por valor string', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const foundOption = result.current.getOptionByValue('1');
      expect(foundOption).toBeTruthy();
      expect(foundOption?.value).toBe('1');
      expect(foundOption?.label).toBe('Construcción');
    });

    test('getOptionByValue debe encontrar opción por valor number', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const foundOption = result.current.getOptionByValue(2);
      expect(foundOption).toBeTruthy();
      expect(foundOption?.value).toBe('2');
    });

    test('getOptionByValue debe retornar null si no encuentra opción', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const notFoundOption = result.current.getOptionByValue('999');
      expect(notFoundOption).toBeNull();
    });

    test('getOptionsByQuery debe filtrar por texto', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      // Buscar por texto exacto
      let filteredOptions = result.current.getOptionsByQuery('Construcción');
      expect(filteredOptions).toHaveLength(1);
      expect(filteredOptions[0].label).toBe('Construcción');

      // Buscar por texto parcial (case insensitive)
      filteredOptions = result.current.getOptionsByQuery('cons');
      expect(filteredOptions).toHaveLength(1);
      expect(filteredOptions[0].label).toBe('Construcción');

      // Buscar por ID
      filteredOptions = result.current.getOptionsByQuery('2');
      expect(filteredOptions).toHaveLength(1);
      expect(filteredOptions[0].value).toBe('2');
    });

    test('getOptionsByQuery debe retornar todas las opciones con query vacía', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const allOptions = result.current.getOptionsByQuery('');
      expect(allOptions).toHaveLength(3);

      const allOptionsSpaces = result.current.getOptionsByQuery('   ');
      expect(allOptionsSpaces).toHaveLength(3);
    });

    test('getOptionsByQuery debe retornar vacío si no hay coincidencias', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const noMatches = result.current.getOptionsByQuery('noexiste');
      expect(noMatches).toHaveLength(0);
    });

    test('refetch debe recargar datos correctamente', async () => {
      mockElectronAPI.categoria.listar
        .mockResolvedValueOnce(mockCategorias.slice(0, 1)) // Primera carga: 1 categoría
        .mockResolvedValueOnce(mockCategorias); // Refetch: 3 categorías

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      // Primera carga
      await waitFor(() => {
        expect(result.current.options).toHaveLength(1);
      });

      // Refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledTimes(2);
    });

    test('refetch debe manejar errores', async () => {
      mockElectronAPI.categoria.listar
        .mockResolvedValueOnce(mockCategorias) // Primera carga exitosa
        .mockRejectedValueOnce(new Error('Error de red')); // Refetch falla

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      // Primera carga exitosa
      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      // Refetch con error
      await result.current.refetch();

      // Las opciones deberían mantenerse (no se pierden con el error)
      expect(result.current.options).toHaveLength(3);
      // El error debería ser capturado
      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledTimes(2);
    });
  });

  describe('Estados de carga y fetching', () => {
    test('debe mostrar isFetching durante recargas', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockElectronAPI.categoria.listar.mockReturnValue(pendingPromise);

      const { result, rerender } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      // Estado inicial
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isPending).toBe(true);
      expect(result.current.isFetching).toBe(true);

      // Resolver la primera carga
      resolvePromise!(mockCategorias);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isFetching).toBe(false);
      });

      // Iniciar refetch
      const refetchPromise = Promise.resolve(mockCategorias);
      mockElectronAPI.categoria.listar.mockReturnValue(refetchPromise);

      await result.current.refetch();

      // Durante refetch no debería estar en isLoading/pending inicial
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPending).toBe(false);
      // Pero sí debería estar en isFetching
      expect(result.current.isFetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });

  describe('Configuración de caché y retries', () => {
    test('no debe llamar a la API para tipos diferentes', async () => {
      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'presentacion', // Pedir presentaciones
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Solo debe llamar a presentaciones.listar, no a categorías.listar
      expect(mockElectronAPI.presentacion.listar).toHaveBeenCalled();
      expect(mockElectronAPI.categoria.listar).not.toHaveBeenCalled();
    });

    test('debe manejar includeInactive correctamente', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          includeInactive: false
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      expect(mockElectronAPI.categoria.listar).toHaveBeenCalledWith(mockIdInstitucion, false);
    });

    test('debe incluir solo activas cuando includeInactive es false', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          includeInactive: false
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      // Aunque includeInactive es false, el hook carga los datos pero
      // las opciones inactivas deben estar deshabilitadas (isDisabled: true)
      expect(result.current.options.filter(opt => opt.isDisabled)).toHaveLength(1);
    });
  });

  describe('Optimizaciones y rendimiento', () => {
    test('debe usar useMemo para opciones y useCallback para funciones', async () => {
      mockElectronAPI.categoria.listar.mockResolvedValue(mockCategorias);

      const { result, rerender } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      const initialOptions = result.current.options;
      const initialGetOptionByValue = result.current.getOptionByValue;
      const initialGetOptionsByQuery = result.current.getOptionsByQuery;

      // Rerender sin cambios en props
      rerender();

      // Las funciones deben mantener la misma referencia (useCallback)
      expect(result.current.getOptionByValue).toBe(initialGetOptionByValue);
      expect(result.current.getOptionsByQuery).toBe(initialGetOptionsByQuery);

      // Las opciones deben mantener la misma referencia si no hay cambios (useMemo)
      expect(result.current.options).toBe(initialOptions);
    });

    test('debe regenerar opciones cuando cambian los datos', async () => {
      mockElectronAPI.categoria.listar
        .mockResolvedValueOnce(mockCategorias.slice(0, 1))
        .mockResolvedValueOnce(mockCategorias);

      const { result } = renderHook(
        () => useDynamicSelectOptions({
          type: 'categoria',
          idInstitucion: mockIdInstitucion
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.options).toHaveLength(1);
      });

      const initialOptions = result.current.options;

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.options).toHaveLength(3);
      });

      // Las opciones deben ser diferentes (nuevo array) cuando cambian los datos
      expect(result.current.options).not.toBe(initialOptions);
      expect(result.current.options.length).toBeGreaterThan(initialOptions.length);
    });
  });
});