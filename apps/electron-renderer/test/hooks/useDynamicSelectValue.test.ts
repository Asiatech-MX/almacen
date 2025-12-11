import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useDynamicSelectValue } from '../../src/hooks/useDynamicSelectValue';
import { DynamicSelectOption } from '../../src/hooks/useDynamicSelectOptions';
import { createTestQueryClient, createTestWrapper, mockElectronAPI, mockCategorias, mockPresentaciones } from './setup';

describe('useDynamicSelectValue Hook', () => {
  const mockIdInstitucion = 1;
  let queryClient: any;
  let wrapper: any;
  let mockOptions: DynamicSelectOption[];

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createTestWrapper(queryClient);

    // Preparar mock options
    mockOptions = [
      {
        value: '1',
        label: 'Construcción',
        data: mockCategorias[0],
        isDisabled: false
      },
      {
        value: '2',
        label: 'Electricidad',
        data: mockCategorias[1],
        isDisabled: false
      },
      {
        value: '1',
        label: 'Kilogramo (kg)',
        data: mockPresentaciones[0],
        isDisabled: false
      },
      {
        value: '2',
        label: 'Litro (L)',
        data: mockPresentaciones[1],
        isDisabled: false
      }
    ];
  });

  describe('Resolución de valores', () => {
    test('debe retornar null para currentValue null o undefined', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: null,
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2), // Solo categorías
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeNull();
      expect(result.current.getValueForForm()).toBeNull();
    });

    test('debe retornar null para currentValue = 0', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: 0,
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeNull();
      expect(result.current.getValueForForm()).toBeNull();
    });

    test('debe retornar null para currentValue = "0"', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '0',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeNull();
      expect(result.current.getValueForForm()).toBeNull();
    });

    test('debe encontrar opción existente por valor string', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2), // Solo categorías
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeTruthy();
      expect(result.current.resolvedValue?.value).toBe('1');
      expect(result.current.resolvedValue?.label).toBe('Construcción');
      expect(result.current.resolvedValue?.data).toEqual(mockCategorias[0]);
    });

    test('debe encontrar opción existente por valor number', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: 2,
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2), // Solo categorías
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeTruthy();
      expect(result.current.resolvedValue?.value).toBe('2');
      expect(result.current.resolvedValue?.label).toBe('Electricidad');
      expect(result.current.resolvedValue?.data).toEqual(mockCategorias[1]);
    });

    test('debe crear opción temporal cuando no se encuentra en opciones', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '999',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2), // Solo categorías
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeTruthy();
      expect(result.current.resolvedValue?.value).toBe('999');
      expect(result.current.resolvedValue?.label).toBe('999 (no encontrado)');
      expect(result.current.resolvedValue?.data).toBeNull();
      expect(result.current.resolvedValue?.isDisabled).toBe(false);
    });

    test('debe usar caché de QueryClient para opción temporal', async () => {
      // Poner datos en caché
      queryClient.setQueryData(
        ['categorias', mockIdInstitucion, true],
        mockCategorias
      );

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '3',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2), // Solo primeras 2 categorías
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeTruthy();
      expect(result.current.resolvedValue?.value).toBe('3');
      expect(result.current.resolvedValue?.label).toBe('Fontanería'); // Debe usar el nombre del caché
      expect(result.current.resolvedValue?.data).toEqual(mockCategorias[2]);
      expect(result.current.resolvedValue?.isDisabled).toBe(true); // Inactiva
    });
  });

  describe('Función getValueForForm', () => {
    test('debe retornar ID numérico cuando hay datos resueltos', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      const formValue = result.current.getValueForForm();
      expect(formValue).toBe(1); // ID numérico
      expect(typeof formValue).toBe('number');
    });

    test('debe retornar valor numérico si currentValue es numérico', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: 2,
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      const formValue = result.current.getValueForForm();
      expect(formValue).toBe(2);
      expect(typeof formValue).toBe('number');
    });

    test('debe retornar valor original si no puede convertir a número', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: 'abc123',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      const formValue = result.current.getValueForForm();
      expect(formValue).toBe('abc123');
      expect(typeof formValue).toBe('string');
    });

    test('debe retornar null para valores vacíos', () => {
      const testValues = [null, undefined, 0, '0'];

      testValues.forEach(currentValue => {
        const { result } = renderHook(
          () => useDynamicSelectValue({
            currentValue,
            type: 'categoria',
            idInstitucion: mockIdInstitucion,
            options: mockOptions.slice(0, 2),
            isFetching: false
          }),
          { wrapper }
        );

        expect(result.current.getValueForForm()).toBeNull();
      });
    });
  });

  describe('Función createTemporaryOption', () => {
    test('debe crear opción temporal básica sin caché', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '123',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: [],
          isFetching: false
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption('123');
      expect(tempOption).toEqual({
        value: '123',
        label: '123 (no encontrado)',
        data: null,
        isDisabled: false
      });
    });

    test('debe crear opción temporal con indicador de actualización', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '123',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: [],
          isFetching: true
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption('123');
      expect(tempOption).toEqual({
        value: '123',
        label: '123 (actualizando...)',
        data: null,
        isDisabled: false
      });
    });

    test('debe usar caché para crear opción temporal enriquecida', async () => {
      // Poner datos en caché
      queryClient.setQueryData(
        ['presentaciones', mockIdInstitucion, true],
        mockPresentaciones
      );

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '3',
          type: 'presentacion',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(2, 4), // Solo primeras 2 presentaciones
          isFetching: false
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption('3');
      expect(tempOption).toEqual({
        value: '3',
        label: 'Unidad', // Debe usar el nombre del caché
        data: mockPresentaciones[2],
        isDisabled: true // Inactiva
      });
    });

    test('debe manejar valores number en createTemporaryOption', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: 123,
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: [],
          isFetching: false
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption(123);
      expect(tempOption.value).toBe('123'); // Debe convertir a string
    });
  });

  describe('Tipo de datos (Categoría vs Presentación)', () => {
    test('debe manejar correctamente categorías', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption('999');
      expect(tempOption.label).toBe('999 (no encontrado)');

      const resolved = result.current.resolvedValue;
      expect(resolved?.data).toHaveProperty('nombre');
      expect(resolved?.data).not.toHaveProperty('abreviatura');
    });

    test('debe manejar correctamente presentaciones', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'presentacion',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(2, 4),
          isFetching: false
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption('999');
      expect(tempOption.label).toBe('999 (no encontrado)');

      const resolved = result.current.resolvedValue;
      expect(resolved?.data).toHaveProperty('nombre');
      expect(resolved?.data).toHaveProperty('abreviatura');
    });

    test('debe generar labels diferentes para categorías y presentaciones', () => {
      // Para categorías
      const { result: categoriaResult } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 1),
          isFetching: false
        }),
        { wrapper }
      );

      // Para presentaciones
      const { result: presentacionResult } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'presentacion',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(2, 3),
          isFetching: false
        }),
        { wrapper }
      );

      // Los labels deben ser diferentes
      expect(categoriaResult.current.resolvedValue?.label).toBe('Construcción');
      expect(presentacionResult.current.resolvedValue?.label).toBe('Kilogramo (kg)');
    });
  });

  describe('Estado isUpdating', () => {
    test('debe ser false cuando no hay currentValue', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: null,
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: true
        }),
        { wrapper }
      );

      expect(result.current.isUpdating).toBe(false);
    });

    test('debe ser false cuando no está fetchiando', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.isUpdating).toBe(false);
    });

    test('debe ser false cuando se encuentra opción actual', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: true
        }),
        { wrapper }
      );

      expect(result.current.isUpdating).toBe(false);
    });

    test('debe ser true cuando hay valor pero no se encuentra opción y está fetchiando', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '999',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2), // No contiene valor 999
          isFetching: true
        }),
        { wrapper }
      );

      expect(result.current.isUpdating).toBe(true);
    });
  });

  describe('Manejo de caché de QueryClient', () => {
    test('debe usar caché de categorías para buscar datos', async () => {
      // Poner categorías en caché
      queryClient.setQueryData(
        ['categorias', mockIdInstitucion, true],
        mockCategorias
      );

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '2',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 1), // Solo tiene la categoría 1
          isFetching: false
        }),
        { wrapper }
      );

      // Debe encontrar la categoría 2 en caché
      const resolvedValue = result.current.resolvedValue;
      expect(resolvedValue?.value).toBe('2');
      expect(resolvedValue?.label).toBe('Electricidad');
      expect(resolvedValue?.data).toEqual(mockCategorias[1]);
    });

    test('debe usar caché de presentaciones para buscar datos', async () => {
      // Poner presentaciones en caché
      queryClient.setQueryData(
        ['presentaciones', mockIdInstitucion, true],
        mockPresentaciones
      );

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '2',
          type: 'presentacion',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(2, 3), // Solo tiene la presentación 1
          isFetching: false
        }),
        { wrapper }
      );

      // Debe encontrar la presentación 2 en caché
      const resolvedValue = result.current.resolvedValue;
      expect(resolvedValue?.value).toBe('2');
      expect(resolvedValue?.label).toBe('Litro (L)');
      expect(resolvedValue?.data).toEqual(mockPresentaciones[1]);
    });

    test('debe manejar diferentes includeInactive en caché', async () => {
      // Poner solo categorías activas en caché (includeInactive: false)
      queryClient.setQueryData(
        ['categorias', mockIdInstitucion, false],
        mockCategorias.filter(cat => cat.activo)
      );

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: [],
          isFetching: false,
          includeInactive: false // Buscar en caché activas
        }),
        { wrapper }
      );

      // Debe encontrar la categoría 1 en caché de activas
      const resolvedValue = result.current.resolvedValue;
      expect(resolvedValue?.value).toBe('1');
      expect(resolvedValue?.data).toEqual(mockCategorias[0]);
    });
  });

  describe('Casos extremos y manejo de errores', () => {
    test('debe manejar opciones con valor no string', () => {
      const optionsWithNumbers: DynamicSelectOption[] = [
        { value: 1, label: 'Option 1', data: null, isDisabled: false }
      ];

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: optionsWithNumbers,
          isFetching: false
        }),
        { wrapper }
      );

      // Debe poder encontrar la opción aunque el value sea number
      expect(result.current.resolvedValue?.value).toBe(1);
    });

    test('debe manejar QueryClient sin datos en caché', () => {
      // No poner nada en caché

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '999',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: [],
          isFetching: false
        }),
        { wrapper }
      );

      const tempOption = result.current.createTemporaryOption('999');
      expect(tempOption.data).toBeNull();
      expect(tempOption.label).toBe('999 (no encontrado)');
    });

    test('debe manejar datos en caché con formato inesperado', async () => {
      // Poner datos mal formateados en caché
      queryClient.setQueryData(
        ['categorias', mockIdInstitucion, true],
        [{ id: '1', nombre: 'Test' }] // Sin propiedades completas
      );

      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: [],
          isFetching: false
        }),
        { wrapper }
      );

      // Debe manejar datos incompletos sin errores
      expect(result.current.resolvedValue).toBeTruthy();
      expect(result.current.resolvedValue?.value).toBe('1');
    });

    test('debe manejar currentValue vacío string', () => {
      const { result } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      expect(result.current.resolvedValue).toBeNull();
      expect(result.current.getValueForForm()).toBeNull();
    });
  });

  describe('Optimizaciones y rendimiento', () => {
    test('debe usar useCallback para las funciones', () => {
      const { result, rerender } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      const initialGetValueForForm = result.current.getValueForForm;
      const initialCreateTemporaryOption = result.current.createTemporaryOption;

      // Rerender sin cambios
      rerender();

      // Las funciones deben mantener la misma referencia
      expect(result.current.getValueForForm).toBe(initialGetValueForForm);
      expect(result.current.createTemporaryOption).toBe(initialCreateTemporaryOption);
    });

    test('debe usar useMemo para resolvedValue e isUpdating', () => {
      const { result, rerender } = renderHook(
        () => useDynamicSelectValue({
          currentValue: '1',
          type: 'categoria',
          idInstitucion: mockIdInstitucion,
          options: mockOptions.slice(0, 2),
          isFetching: false
        }),
        { wrapper }
      );

      const initialResolvedValue = result.current.resolvedValue;
      const initialIsUpdating = result.current.isUpdating;

      // Rerender sin cambios
      rerender();

      // Deben mantener la misma referencia si no hay cambios
      expect(result.current.resolvedValue).toBe(initialResolvedValue);
      expect(result.current.isUpdating).toBe(initialIsUpdating);
    });
  });
});